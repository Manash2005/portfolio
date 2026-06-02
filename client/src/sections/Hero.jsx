
function Hero() {
  return (
    <section className="bg-background min-h-screen">
        <div className="block md:flex">

            {/* left column */}
            <div className="w-full md:w-1/2 mt-10 md:mt-0">
                <p className="text-primary text-3xl px-1 font-bold" style={{animation: 'fadeIn 1s ease-in-out'}}>I am <span className="text-foreground font-mono">Manash</span></p>

                {/* Role */}
                <p className="text-secondary text-7xl mt-7" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.1s`}}>Full-Stack <br /> Developer</p>

                {/* Description */}
                <p className="text-secondary text-lg mt-7" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.2s`}}>
                    I am a passionate full-stack developer with expertise in building scalable web applications. I enjoy working with modern technologies and continuously learning to enhance my skills.
                </p>
            </div>

            {/* right column */}
            <div className="w-full md:w-1/2 mt-10 md:mt-0">
                <img src="/heroImage.png" alt="Hero Image" className="w-full" style={{animation: `fadeIn 1s ease-in-out`, animationDelay: `0.3s`}} />
            </div>
        </div>
    </section>
  )
}

export default Hero