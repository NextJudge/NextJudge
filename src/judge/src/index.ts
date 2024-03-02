
import { createClient } from 'redis';
import { commandOptions } from 'redis';
import * as fs from 'fs';
import { spawnSync } from 'bun';

const { REDIS_HOST, REDIS_PORT, BRIDGE_HOST, BRIDGE_PORT } = process.env

const NEXTJUDGE_USER_ID = 99999
const BUILD_DIRECTORY = "/chroot/build_dir"
const RUN_DIRECTORY = "/chroot/run_dir"

const BUILD_SCRIPT_PATH = `${BUILD_DIRECTORY}/build.sh`
const RUN_SCRIPT_PATH = `${RUN_DIRECTORY}/main`


// const BASE_NSJAIL_COMMANDLINE = [
//     "nsjail",
//     "--mode", "o",
//     "--time_limit", `${10}`,
//     "--max_cpus", `${1}`, 
//     "--rlimit_as", `${512}`, // Max virtual memory space
//     "--rlimit_cpu", `${10}`, // Max CPU time
//     "--rlimit_nofile", `${3}`, // Max file descriptor num+1 that can be opened
//     "--nice_level", "-20", // High priority
//     // "--seccomp_policy", "Path to file containined seccomp-bpf policy. _string for string" // Allowed syscalls 
//     "--persona_addr_no_randomize", // Disable ASLR
//     "--user", `${NEXTJUDGE_USER_ID}`,
//     "--group", `${NEXTJUDGE_USER_ID}`,
// ];
//    
const BUILD_SCRIPTS = {
    'cpp': `#!/bin/sh
        g++ {IN_FILE} -o main 
    `,
    'py': `#!/bin/sh
        echo "#!/bin/sh" >> main
        echo "python3 {IN_FILE}" >> main
        chmod +x main
    `,
}


export const LANG_TO_EXTENSION = {
    "C++": "cpp",
    Python: "py",
    Go: "go",
    Java: "java",
    Node: "ts",
} as const;

  

type Languages = 'C++' | 'Python'

interface Submission {
    source_code: string,
    id: number;
    user_id: number;
    problem_id: number;
    time_elapsed: number;
    language: Languages;
    failed_test_case_id: number
    submit_time: string,
}


export interface TestCase {
    input: string;
    expected_output: string;
}
  



function split_and_trim(code: string) {
    return code.split("\n").map((sentence) => sentence.trimEnd());
}

export function compare_input_output(expected: string, real: string): boolean 
{
    const expected_lines = split_and_trim(expected.trim());
    const real_lines = split_and_trim(real.trim());
  
    if (expected_lines.length !== real_lines.length) {
      return false;
    }
  
    // Compare the output line by line
    for (let i = 0; i < expected_lines.length; i += 1) {
        if (expected_lines[i] !== real_lines[i]) {
            return false;
        }
    }
  
    return true;
}


async function submit_judgement(submission: Submission, success: boolean)
{
    const body = JSON.stringify({
        submission_id: submission.id,
        success: success ? "SUCCESS" : "FAIL"
    });

    console.log("Submitting judgement to bridge")
    console.log(body);

    // Send a response to the bridge saying we are done
    const send = await fetch(`http://${BRIDGE_HOST}:${BRIDGE_PORT}/judging_complete`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: body
    });
}

async function process_submission(submission: Submission)
{
    // First, fetch all testcases
    // Send a response to the bridge saying we are done
    const db_submission_request = await fetch(`http://${BRIDGE_HOST}:${BRIDGE_PORT}/testcases/${submission.problem_id}`);

    const final_submission_data = await db_submission_request.json();
    
    console.log(final_submission_data)

    const testcases = final_submission_data.test_cases as TestCase[];


    // Ensure relevent directories exist
    Bun.spawnSync({
        cmd: ["mkdir", "-p", BUILD_DIRECTORY]
    });

    Bun.spawnSync({
        cmd: ["mkdir", "-p", RUN_DIRECTORY]
    });


    if(!compile_in_jail(submission)){
        // Compile-time error
        submit_judgement(submission, false);
        return;
    }


    let success = true;
    for(const test of testcases){
        if(!run_single_test_case(test)){
            success = false;
            break;
        }
    }

    console.log("Done running test cases")
    // Delete run directory 
    fs.rmSync(RUN_DIRECTORY, { recursive: true, force: true });

    submit_judgement(submission, success);
}

// Convert a submission into a form that can be run - either an executable or 
// a bash script wrapper
function compile_in_jail(submission: Submission): boolean
{
    // Compile in an nsjail

    if(!(submission.language in LANG_TO_EXTENSION)){
        console.log("Unsupported language",submission.language)
        console.log(LANG_TO_EXTENSION)
        return false;
    }

    const code = submission.source_code;

    const extension = LANG_TO_EXTENSION[submission.language]

    const INPUT_FILE_PATH = `${BUILD_DIRECTORY}/input.${extension}`

    console.log("Writing to:")
    console.log(INPUT_FILE_PATH)
    
    fs.writeFileSync(INPUT_FILE_PATH, code);



    let build_script: string = BUILD_SCRIPTS[extension];


    const LOCAL_BUILD_DIR = "/build_dir"
    const LOCAL_BUILD_SCRIPT_PATH = `${LOCAL_BUILD_DIR}/build.sh`


    build_script = build_script.replace("{IN_FILE}", `${LOCAL_BUILD_DIR}/input.${extension}`);

    console.log("Build script")
    console.log(build_script)

    console.log("Submission code")
    console.log(code)

    fs.writeFileSync(BUILD_SCRIPT_PATH,build_script)

    fs.chmodSync(BUILD_SCRIPT_PATH, "755");
    fs.chownSync(BUILD_DIRECTORY, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID);
    fs.chownSync(BUILD_SCRIPT_PATH, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID);

    console.log("Compiling")



    spawnSync(["ls","-pla", "/chroot/"])
    spawnSync(["ls","-pla", "/build_dir/"])

    console.log(LOCAL_BUILD_DIR)
    console.log(LOCAL_BUILD_SCRIPT_PATH)
    // const RUN_DIRECTORY = "/chroot/run_dir"

    const compile_result = Bun.spawnSync({
        cmd: [
            "nsjail",
            "--mode", "o",

            "--time_limit", `${10}`,
            "--max_cpus", `${1}`, 
            "--rlimit_as", `${512}`, // Max virtual memory space
            "--rlimit_cpu", `${10}`, // Max CPU time
            "--user", `${NEXTJUDGE_USER_ID}:${NEXTJUDGE_USER_ID}`,
            "--group", `${NEXTJUDGE_USER_ID}:${NEXTJUDGE_USER_ID}`,

            // "--bindmount_ro", "/chroot:/", // Map root file system readonly
            "--chroot", `/chroot/`, // Chroot entire file system
            
            "--bindmount", `${BUILD_DIRECTORY}:${LOCAL_BUILD_DIR}`, // Map build dir as read/write
            "--cwd", `${LOCAL_BUILD_DIR}`,
            "--tmpfsmount", "/tmp",

            "--env", `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`,

            "--exec_file",`${LOCAL_BUILD_SCRIPT_PATH}`,
            "--really_quiet"
        ],
        stderr: "pipe",
        stdout: "pipe"
    });


    // Need to determine this much better
    // TODO: investigate if it passes the error through - how to differentiate
    // between our error, and compile time error
    const compile_error = compile_result.stderr.toString();
    if(compile_error){
        console.log("Error in compilation!", compile_error);
        return false;
    }

    // Copy file from build directory to run directory
    fs.copyFileSync(`${BUILD_DIRECTORY}/main`, `${RUN_SCRIPT_PATH}`);
    
    // Delete build directory 
    fs.rmSync(BUILD_DIRECTORY, { recursive: true, force: true });

    console.log("Done! Compile succeeded")
    return true;
}



function run_single_test_case(testcase: TestCase): boolean
{

    fs.chmodSync(RUN_SCRIPT_PATH, "755");
    fs.chownSync(RUN_DIRECTORY, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID);
    fs.chownSync(RUN_SCRIPT_PATH, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID);

    Bun.spawnSync(["file", RUN_SCRIPT_PATH])
    
    console.log("Running")

    // Run the program
    const run_result = Bun.spawnSync({
        cmd: [
            "nsjail",
            "--mode", "o",
            "--time_limit", `${10}`,
            "--max_cpus", `${1}`, 
            "--rlimit_as", `${512}`, // Max virtual memory space
            "--rlimit_cpu", `${10}`, // Max CPU time
            // "--rlimit_nofile", `${3}`, // Max file descriptor num+1 that can be opened
            "--nice_level", "-20", // High priority
            // "--seccomp_policy", "Path to file containined seccomp-bpf policy. _string for string" // Allowed syscalls 
            "--persona_addr_no_randomize", // Disable ASLR
            "--user", `${NEXTJUDGE_USER_ID}:${NEXTJUDGE_USER_ID}`,
            "--group", `${NEXTJUDGE_USER_ID}:${NEXTJUDGE_USER_ID}`,

            // "--bindmount_ro", "/:/chroot", // Map root file system readonly
            "--chroot", `/chroot`, // Chroot entire file system
            
            "--bindmount", `${RUN_DIRECTORY}:/run_dir`, // Map build dir as read/write
            "--cwd", `/run_dir`,

            "--env", `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, // Map entire file system

            "--exec_file",`/run_dir/main`,
            "--really_quiet"
        ],
        stderr: "pipe",
        stdout: "pipe",
        stdin: new TextEncoder().encode(testcase.input)
    });

    console.log("Program done");

    const run_error = run_result.stderr.toString();
    if(run_error){
        console.log("Error in runtime (?)!", run_error)
        return false;
    }

    const process_stdout = run_result.stdout.toString()
    console.log("Process STDOUT", process_stdout)

    // Compare program output to expected output
    const success = compare_input_output(testcase.expected_output, process_stdout);

    if(success){
        console.log("Program is correct!")
    } else {
        console.log("Program is incorrect!!")
    }

    console.log("Done running testcase!")
    return success;
}


const example = `
#include <iostream>

using namespace std;

int main()
{
    string input;
    cin >> input;
    if(input == "TRUE"){
        cout << "FALSE" << endl;;        
    } else {
        cout << "TRUE" << endl;        
    }
}

`

async function connect_to_redis()
{
    let redis_connection_attempts = 0;

    do {
        console.log("Connection attempt ", redis_connection_attempts, `redis://${REDIS_HOST}:${REDIS_PORT}`)
        let success = true;
        redis_connection_attempts++
        Bun.sleep(2);
        console.log("Sleep done")

        const redis_connection = await createClient(
            {
                url:`redis://${REDIS_HOST}:${REDIS_PORT}`
            }
            ).on('error', err => {
                success = false
            }).connect();

        if(success){
            return redis_connection;
        } else {
            console.log
            Bun.sleep(2);
        }
    }
    while(redis_connection_attempts < 10);

    console.log("Judge failed to connect to queue")
    return null;
}


async function main()
{
    console.log("Judge started")
    const redis_connection = await connect_to_redis();
    if(!redis_connection){
        console.log("Could not connect to redis");
        process.exit(1);
    }

    console.log("Judge connected to redis")
    
    while(true){
        // Continously listen for new jobs on the queue!
        // The queue contains submission_id's\
        console.log("Judge waiting for new submissions");
        
        const value = await redis_connection.blPop(
            commandOptions({ isolated: true }),
            'submissions',
            0
        );

        console.log("Judge received a submission!")

        const submission_id = value?.element

        if(submission_id === undefined){
            console.error("ERROR: queue popped null object")
            continue;
        }

        // Query database for all the relevent information regarding this submission_id
        // Meaning the user code, the testcases, and more.

        console.log(`http://${BRIDGE_HOST}:${BRIDGE_PORT}/submission/${submission_id}`)

        const submission_data = await fetch(`http://${BRIDGE_HOST}:${BRIDGE_PORT}/submission/${submission_id}`);

        const user_submission = await submission_data.json() as Submission;
        console.log("User submission data!")
        console.log(user_submission)

        if(!submission_data.ok){
            console.log("Getting submission data failed!")
            console.log(user_submission)
            continue;
        }

        console.log("Submission data got successfully!")
        
        process_submission(user_submission);

        
    }
}

console.log("Hello")
console.log(`
${BUILD_DIRECTORY}
${RUN_DIRECTORY}
${BUILD_SCRIPT_PATH}
${RUN_SCRIPT_PATH}
`)

console.log("Judge booted")
console.log("Judge booted2")
main()
