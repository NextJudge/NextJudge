
import { createClient } from 'redis';
import { commandOptions } from 'redis';
import * as fs from 'fs';

const { REDIS_HOST, REDIS_PORT } = process.env

const NEXTJUDGE_USER_ID = 99999
const BUILD_DIRECTORY = "/build_dir"
const RUN_DIRECTORY = "/run_dir"

const BUILD_SCRIPT_PATH = `${BUILD_DIRECTORY}/build.sh`
const RUN_SCRIPT_PATH = `${RUN_DIRECTORY}/main`


const BASE_NSJAIL_COMMANDLINE = [
    "nsjail",
    "--mode", "o",
    "--time_limit", `${10}`,
    "--max_cpus", `${1}`, 
    "--rlimit_as", `${512}`, // Max virtual memory space
    "--rlimit_cpu", `${10}`, // Max CPU time
    "--rlimit_nofile", `${3}`, // Max file descriptor num+1 that can be opened
    "--nice_level", "-20", // High priority
    // "--seccomp_policy", "Path to file containined seccomp-bpf policy. _string for string" // Allowed syscalls 
    "--persona_addr_no_randomize", // Disable ASLR
    "--user", `${NEXTJUDGE_USER_ID}`,
    "--group", `${NEXTJUDGE_USER_ID}`,
];

const BUILD_SCRIPTS = {
    'cpp': `#!/bin/sh
        g++ {IN_FILE} -o main
    `,
    'python': `#!/bin/sh
        echo "#!/bin/sh" >> main
        echo "python3 {IN_FILE}" >> main
        chmod +x main
    `,
}

const LANG_EXTENSION =  {
    "python":"py",
    "cpp": ".cpp"
}

type Languages = 'cpp' | 'python'

interface Submission {
    submission_id?: number;
    code: string;
    language: Languages;
    tests: TestCase[];
}

interface TestCase {
    input: string;
    output: string;
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


async function process_submission(submission: Submission)
{
    // TODO: Get information from the submission
    compile_in_jail(submission);

    // TODO: pass real data from the testcase
    // TOOO: make real testcases
    run_single_test_case({input: "", output: ""});
}

// Convert a submission into a form that can be run - either an executable or 
// a bash script wrapper
function compile_in_jail(submission: Submission)
{
    // Compile in an nsjail

    const code = submission.code;

    Bun.spawnSync({
        cmd: ["mkdir", "-p", BUILD_DIRECTORY]
    });

    const INPUT_FILE_PATH = `${BUILD_DIRECTORY}/input.${LANG_EXTENSION[submission.language]}`


    fs.writeFileSync(INPUT_FILE_PATH, code);

    let build_script = BUILD_SCRIPTS[submission.language];
    build_script = build_script.replace("{IN_FILE}", INPUT_FILE_PATH);

    fs.writeFileSync(BUILD_SCRIPT_PATH,build_script)

    fs.chmodSync(BUILD_SCRIPT_PATH, "755");
    fs.chownSync(BUILD_DIRECTORY, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID);
    fs.chownSync(BUILD_SCRIPT_PATH, NEXTJUDGE_USER_ID, NEXTJUDGE_USER_ID);

    console.log("Compiling")

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

            "--bindmount_ro", "/:/", // Map root file system readonly
            "--chroot", `/`, // Chroot entire file system
            
            "--bindmount", `${BUILD_DIRECTORY}:${BUILD_DIRECTORY}`, // Map build dir as read/write
            "--cwd", `${BUILD_DIRECTORY}`,

            "--env", `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, // Map entire file system

            "--exec_file",`${BUILD_SCRIPT_PATH}`,
            "--really_quiet"
        ],
        stderr: "pipe",
        stdout: "pipe"
    });


    const compile_error = compile_result.stderr.toString();
    if(compile_error){
        console.log("Error in compilation!", compile_error)
        return;
    }


    // Copy file from build directory to run directory
    fs.copyFileSync(`${BUILD_DIRECTORY}/main`, `${RUN_SCRIPT_PATH}`);
    
    // Delete build directory 
    fs.rmSync(BUILD_DIRECTORY, { recursive: true, force: true });
}



function run_single_test_case(testcase: TestCase)
{
    Bun.spawnSync({
        cmd: ["mkdir", "-p", RUN_DIRECTORY]
    });

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

            "--bindmount_ro", "/:/", // Map root file system readonly
            "--chroot", `/`, // Chroot entire file system
            
            "--bindmount", `${RUN_DIRECTORY}:${RUN_DIRECTORY}`, // Map build dir as read/write
            "--cwd", `${RUN_DIRECTORY}`,

            "--env", `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin`, // Map entire file system

            "--exec_file",`${RUN_SCRIPT_PATH}`,
            "--really_quiet"
        ],
        stderr: "pipe",
        stdout: "pipe",
        stdin: new TextEncoder().encode(testcase.input)
    });

    console.log("Program done");

    // Delete run directory 
    fs.rmSync(RUN_DIRECTORY, { recursive: true, force: true });
    
    const run_error = run_result.stderr.toString();
    if(run_error){
        console.log("Error in runtime (?)!", run_error)
        return;
    }
    const process_stdout = run_result.stdout.toString()
    console.log(process_stdout)

    // Compare program output to expected output
    const success = compare_input_output(testcase.output, process_stdout);

    console.log(success);
    // Send response back!


    console.log("Done running it!")
}



const example = `
#include <stdio.h>

int main()
{
    printf("Hello world!");        
}

`
async function test()
{

    process_submission({
        code:example,
        language:"cpp",
        tests: [],
        submission_id: 1
    })
}

async function main()
{

    const redis_connection = await createClient(
        {
            url:`redis://${REDIS_HOST}:${REDIS_PORT}`
        }
    ).on('error', err => {
        console.log('Redis Client Error', err);
        process.exit(1);
    }).connect();

    

    while(true){
        // Continously listen for new jobs on the queue!
        // The queue contains submission_id's
        const value = await redis_connection.blPop(
            commandOptions({ isolated: true }),
            'submissions',
            0
        );

        const submission_id = value?.element

        if(submission_id === undefined){
            console.error("ERROR: queue popped null object")
            continue;
        }

        // Query database for all the relevent information regarding this submission_id
        // Meaning the user code, the testcases, and more.

        process_submission(submission_id);


        
    }
}

// main()
test()
