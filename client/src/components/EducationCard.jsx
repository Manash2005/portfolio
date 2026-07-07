function EducationCard({ institute, logo, details }) {
  return (
    <div className="bg-neutral-950/40 border border-white/10 backdrop-blur-md hover:border-foreground/30 p-5 rounded-2xl transition-all duration-300 w-full">
      <div className="flex items-center justify-between gap-4">
        {/* Left Content */}
        <div className="flex-1">
          {/* Institute Name */}
          <h3 className="text-foreground text-lg font-bold font-mono tracking-wide mb-3">
            {institute}
          </h3>

          {/* Details */}
          <div className="space-y-2 border-t border-white/5 pt-3">
            {Object.entries(details).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center text-xs font-mono">
                <span className="text-white/40 capitalize">{key}:</span>
                <span className="text-foreground font-semibold">{value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right Logo */}
        {logo && (
          <div className="shrink-0 w-12 h-12 p-2 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center">
            <img
              src={logo}
              alt={`${institute} Logo`}
              className="w-full h-full object-contain rounded-md"
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default EducationCard;