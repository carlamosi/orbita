import { useWorldData } from '../context/WorldDataContext'

export default function CountryList({ countries, onSelectCountry, selectedCountryId }) {
  if (!countries) return null

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 mt-4 space-y-2 border-t border-white/10 pt-4">
      {countries.map(c => {
        const isSelected = selectedCountryId === c.id
        return (
          <button
            key={c.id}
            onClick={() => onSelectCountry(c)}
            className={`w-full flex items-center justify-between p-3 rounded-xl transition-all border ${
              isSelected 
                ? 'bg-violet/20 border-violet hover:bg-violet/30' 
                : 'bg-white/5 border-transparent hover:bg-white/10 hover:border-white/10'
            }`}
          >
            <div className="flex items-center gap-3">
              <img src={`https://flagcdn.com/h40/${c.flagCode}.png`} className="w-8 h-5 object-cover rounded shadow" alt="flag" />
              <span className="font-inter text-sm text-left text-white max-w-[120px] truncate">{c.name}</span>
            </div>
            <span className="text-[10px] font-mono text-[#8B8FA8] uppercase tracking-wider bg-black/40 px-2 py-1 rounded">
               {c.continent || c.region || 'N/A'}
            </span>
          </button>
        )
      })}
      {countries.length === 0 && (
        <div className="text-center text-[#8B8FA8] text-sm py-8 font-inter">No countries found.</div>
      )}
    </div>
  )
}
