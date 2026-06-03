import StatCard from "../components/StatCard"
import {Download} from "lucide-react"
import SocialMediaCard from "../components/SocialMediaCard"
import { FaGithub, FaLinkedin } from "react-icons/fa"
import { SiGmail } from "react-icons/si"
import EducationCard from "../components/EducationCard"
import SkillsCard from "../components/SkillsCard"
function Hero() {

  return (
    <section className="bg-background min-h-screen">

        {/* Top section */}
        <div className="block md:flex border-b-[0.1px]">

            {/* left column */}
            <div className="w-full md:w-1/2 mt-10 md:mt-0">
                <p className="text-primary text-3xl px-1 font-bold" style={{animation: 'fadeIn 1s ease-in-out'}}>I am <span className="text-foreground font-mono">Manash</span></p>

                {/* Role */}
                <p className="text-secondary text-7xl mt-7" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.1s`}}>Full-Stack <br /> Developer</p>

                {/* Description */}
                <p className="text-secondary text-lg mt-7" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.2s`}}>
                    I am a passionate full-stack developer with expertise in building scalable web applications. I enjoy working with modern technologies and continuously learning to enhance my skills.
                </p>


                <div className="flex justify-between mt-10 mb-4">
                    {/* Download Resume Button */}
                    <div className="flex justify-center bg-foreground border-secondary/50 p-4 rounded-2xl w-min h-min hover:bg-hover hover:text-black hover:scale-102 transition-all duration-400" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.3s`}}>
                    <input type="button" value="Download Resume" className="mr-5"/>
                    <Download />
                    </div>

                    {/* Socials */}
                    <div className="flex items-center justify-center" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.5s`}}>
                        <SocialMediaCard href="https://github.com/manashswain" icon={<FaGithub/>} description="GitHub" />
                        <SocialMediaCard href="https://www.linkedin.com/in/manashswain" icon={<FaLinkedin />} description="LinkedIn" />
                        <SocialMediaCard href="mailto:swainm099@gmail.com" icon={<SiGmail />} description="Email" />
                    </div>
                </div>
            </div>

            {/* right column */}
            <div className="w-full md:w-1/2 mt-10 md:mt-0">
                <img src="/heroImage.png" alt="Hero Image" className="h-full object-cover" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.3s`}} />
            </div>
        </div>

        {/* Bottom section */}
        <div className="block md:flex justify-between mt-4 border-b-[0.1px] py-4">
            {/* Education */}
            <div className="p-1">
                <div className="text-center">
                    <p className="text-primary text-4xl font-bold" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.3s`}}>EDUCATION</p>
                </div>

                <div className="flex flex-col items-center justify-center mt-10 gap-10" style={{animation: `fadeIn 1s ease-in-out`}}>
                    <EducationCard institute="BITS PILANI" logo="/bitsPilaniLogo.png" details={{ degree: "BS in Computer Science", duration: "2024 - 2027" }} />
                    <EducationCard institute="PW IOI" logo="/pwIoiLogo.png" details={{ Program: "Skills Program", duration: "2024 - 2028" }} />
                </div>
            </div>

            {/* Skills */}
            <div className="p-1">
                <div className="text-center">
                    <p className="text-primary text-4xl font-bold">SKILLS</p>
                </div>
                <div className="flex flex-col items-center justify-center mt-10 gap-10" style={{animation: `fadeIn 1s ease-in-out`}}>
                    <SkillsCard
                        title= "Frontend Development"
                        stack={["React", "HTML", "CSS", "JavaScript"]}
                        projects={2}
                    />
                    <SkillsCard
                        title= "Backend Development"
                        stack={["Node.js", "Express.js", "MongoDB", "SQL"]}
                        projects={3}
                    />

                </div>
            </div>

            {/* Stats */}
            <div className="p-1">
                <div className="text-center">
                    <p className="text-primary text-4xl font-bold">STATS</p>
                </div>

                <div className="flex flex-col items-center justify-center mt-10 gap-5" style={{animation: `fadeIn 1s ease-in-out`}}>

                <StatCard value="100+" description="Leetcode Problems" />
                <StatCard value="170+" description="GeeksforGeeks Problems" />
                <StatCard value="2" description="Projects Built" />
                </div>
            </div>
        </div>

    </section>
  )
}

export default Hero