import { Icons } from '@/components/icons'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import Link from 'next/link'

const members = [
    {
        name: 'Tom Nyuma',
        role: '\'Web Wizard\'',
        avatar: '/tom.webp',
        link: 'https://nyuma.dev',
    },
    {
        name: 'Otso Barron',
        role: '\'LeBron James\'',
        avatar: '/otso.webp',
        link: 'https://www.linkedin.com/in/otsobarron/',
    },
    {
        name: 'Andrew Dang',
        role: '\'Adopted\'',
        avatar: '/andrew.webp',
        link: 'https://www.linkedin.com/in/theandrewdang',
    },
    {
        name: 'Jordan Brantner',
        role: '\'CRUD Demon\'',
        avatar: '/jordan.webp',
        link: 'https://www.linkedin.com/in/jordan-brantner-2209a2214',
    },
]

export default function TeamSection() {
    return (
        <>
        <div className="absolute top-4 left-4 z-50">
            <Link href="/" className={cn(buttonVariants({ variant: "link" }), "text-white text-sm tracking-wide")}>
                <Icons.arrowLeft className="w-4 h-4" />
                Home
            </Link>
        </div>
        <section
            className="relative py-16 md:py-32 text-white"
            style={{
                backgroundImage: 'url(/footer-background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
            >
                <div className="absolute inset-0 bg-black/50" />
            <div className="relative mx-auto max-w-5xl border-t border-osu/60 px-6">
                <span className="text-caption -ml-6 -mt-3.5 block w-max bg-black/80 backdrop-blur px-6 text-white">NextJudge Capstone Team</span>
                <div className="mt-4 gap-4 sm:grid sm:grid-cols-2 md:mt-12">
                    <div className="mt-2 sm:mt-0">
                            <p className="text-gray-300">NextJudge is a School of Electrical Engineering and Computer Science (EECS) capstone project developed at Oregon State University, under the supervision of Dr. Mike Bailey.</p>
                    </div>
                    <div className="sm:flex sm:justify-end">
                        <Link href="https://engineering.oregonstate.edu/people/mike-bailey" className="flex flex-col items-end hover:opacity-80 transition-opacity" target="_blank">
                            <img
                                className="size-24 rounded-full object-cover border-2 border-osu/50"
                                src="https://engineering.oregonstate.edu/sites/engineering.oregonstate.edu/files/styles/profile_image/public/2023-04/profile-mike-bailey.jpg?itok=qowpCIFh"
                                alt="Mike Bailey, Professor of Computer Science"
                            />
                            <span className="mt-2 text-xs text-gray-300">Dr. Mike Bailey, Oregon State University</span>
                            <span className="text-xs text-gray-400">Project Advisor</span>
                        </Link>
                    </div>
                </div>
                <div className="mt-8 md:mt-12">
                    <div className="grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
                        {members.map((member, index) => (
                            <div
                                key={index}
                                className="group overflow-hidden">
                                <img
                                    className="h-96 w-full rounded-md object-cover object-top border border-osu/50"
                                    src={member.avatar}
                                    alt="team member"
                                    width="826"
                                    height="1239"
                                />
                                <div className="px-2 pt-2 sm:pb-0 sm:pt-4">
                                    <div className="flex justify-between">
                                        <h3 className="text-base font-medium text-white">{member.name}</h3>
                                        <span className="text-xs text-gray-300">_0{index + 1}</span>
                                    </div>
                                    <div className="mt-1 flex items-center justify-between">
                                        <span className="text-gray-300 text-sm">{member.role}</span>
                                        <Link
                                            href={member.link}
                                            target="_blank"
                                            className="text-osu text-sm tracking-wide hover:underline">
                                            {member.link.includes('linkedin') ? 'LinkedIn' : 'Website'}
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
        </>
    )
}