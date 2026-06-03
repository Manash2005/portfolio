function SkillsCard({ title, stack, projects }) {
  return (
    <div className="w-full bg-linear-to-br from-secondary/10 to-secondary/20 p-6 rounded-xl border border-secondary/30 hover:border-foreground/50 transition-all duration-300 hover:shadow-lg hover:shadow-foreground/20 max-w-sm">
      
      {/* Title */}
      <h3 className="text-foreground text-2xl font-bold mb-4">{title}</h3>
      
      {/* Tech Stack */}
      <div className="mb-6">
        <p className="text-primary font-semibold text-sm mb-3 uppercase tracking-wide">Tech Stack</p>
        <div className="flex flex-wrap gap-2">
          {stack.map((tech) => (
            <div 
              key={tech}
              className="bg-foreground/10 border border-foreground/30 rounded-lg px-3 py-1 hover:bg-foreground/20 transition-colors duration-200"
            >
              <span className="text-primary text-sm font-medium">{tech}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Projects Count */}
      <div className="pt-4 border-t border-secondary/30 flex items-center justify-between">
        <span className="text-primary font-semibold">Projects Built:</span>
        <span className="bg-foreground text-background px-4 py-2 rounded-lg font-bold text-lg">{projects}</span>
      </div>
    </div>
  )
}

export default SkillsCard