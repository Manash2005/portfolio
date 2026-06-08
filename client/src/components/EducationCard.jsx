function EducationCard({ institute, logo, details }) {
  return (
    <div className="bg-secondary/10 p-6 rounded-xl hover:bg-secondary/20 transition-all duration-600 w-full lg:w-sm mb-5 lg:mb-0">
      <div className="flex items-start gap-4">
        
        {/* Left Content */}
        <div className="flex-1 w-md">
          {/* Institute Name */}
          <h3 className="text-foreground text-xl font-bold mb-4">{institute}</h3>
          
          {/* Details */}
          <div className="space-y-2">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex flex-col sm:flex-row sm:justify-between gap-1">
                <span className="text-primary font-mono capitalize">{key}:</span>
                <span className="text-secondary text-sm">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Logo */}
        {logo && (
          <div className="shrink-0 w-10 h-10">
            <img 
              src={logo} 
              alt={`${institute} Logo`} 
              className="object-cover rounded-lg border border-secondary/30"
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default EducationCard