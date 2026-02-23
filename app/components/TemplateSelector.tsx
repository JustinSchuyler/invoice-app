import type { TemplateId } from '../lib/types'

interface Props {
  value: TemplateId
  onChange: (t: TemplateId) => void
}

const templates: { id: TemplateId; name: string; description: string; preview: string }[] = [
  {
    id: 'classic',
    name: 'Classic',
    description: 'Blue accents, header boxes, company info left-aligned.',
    preview: '🟦',
  },
  {
    id: 'modern',
    name: 'Modern',
    description: 'Dark charcoal header, teal accents, zebra-striped rows.',
    preview: '⬛',
  },
  {
    id: 'minimal',
    name: 'Minimal',
    description: 'Black & white only, rule separators, ultra-clean.',
    preview: '⬜',
  },
]

export function TemplateSelector({ value, onChange }: Props) {
  return (
    <div className="grid grid-cols-3 gap-3">
      {templates.map(t => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={`
            text-left p-4 rounded-xl border-2 transition-all
            ${value === t.id
              ? 'border-blue-500 bg-blue-50 shadow-sm'
              : 'border-gray-200 hover:border-gray-300 bg-white'
            }
          `}
        >
          {/* Mini preview */}
          <div className={`w-full aspect-[3/4] rounded-lg mb-3 flex items-center justify-center text-3xl
            ${value === t.id ? 'bg-blue-100' : 'bg-gray-100'}
          `}>
            <TemplatePreview id={t.id} />
          </div>
          <div className={`text-sm font-semibold mb-0.5 ${value === t.id ? 'text-blue-700' : 'text-gray-800'}`}>
            {t.name}
          </div>
          <div className="text-xs text-gray-500 leading-snug">{t.description}</div>
        </button>
      ))}
    </div>
  )
}

function TemplatePreview({ id }: { id: TemplateId }) {
  if (id === 'classic') {
    return (
      <svg width="52" height="68" viewBox="0 0 52 68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="52" height="68" rx="2" fill="white"/>
        <rect y="0" width="52" height="14" rx="2" fill="#2382D2" opacity="0.15"/>
        <rect x="4" y="3" width="18" height="3" rx="1" fill="#2382D2"/>
        <rect x="4" y="8" width="12" height="2" rx="1" fill="#2382D2" opacity="0.5"/>
        <rect x="30" y="3" width="18" height="8" rx="1" fill="#2382D2" opacity="0.3"/>
        <rect x="4" y="16" width="44" height="6" rx="1" fill="#2382D2"/>
        <rect x="4" y="24" width="44" height="4" rx="1" fill="#2382D2" opacity="0.2"/>
        <rect x="4" y="29" width="44" height="3" rx="0.5" fill="#eee"/>
        <rect x="4" y="33" width="44" height="3" rx="0.5" fill="#f5f5f5"/>
        <rect x="4" y="37" width="44" height="3" rx="0.5" fill="#eee"/>
        <rect x="28" y="43" width="20" height="3" rx="0.5" fill="#eee"/>
        <rect x="28" y="47" width="20" height="3" rx="0.5" fill="#eee"/>
        <rect x="28" y="51" width="20" height="4" rx="0.5" fill="#2382D2" opacity="0.7"/>
        <rect x="4" y="57" width="22" height="3" rx="0.5" fill="#eee"/>
        <rect x="4" y="61" width="44" height="2" rx="0.5" fill="#2382D2" opacity="0.3"/>
        <rect x="10" y="64" width="32" height="2" rx="0.5" fill="#2382D2" opacity="0.2"/>
      </svg>
    )
  }
  if (id === 'modern') {
    return (
      <svg width="52" height="68" viewBox="0 0 52 68" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="52" height="68" rx="2" fill="white"/>
        <rect width="52" height="16" rx="2" fill="#2D333D"/>
        <rect x="4" y="4" width="22" height="3" rx="1" fill="white"/>
        <rect x="4" y="9" width="14" height="2" rx="1" fill="#8899AA"/>
        <rect x="34" y="4" width="14" height="8" rx="1" fill="white" opacity="0.15"/>
        <rect x="4" y="20" width="44" height="2" rx="0.5" fill="#ddd"/>
        <rect x="4" y="25" width="44" height="4" rx="0.5" fill="#2D333D"/>
        <rect x="4" y="30" width="44" height="3" rx="0.5" fill="#f5f5f5"/>
        <rect x="4" y="34" width="44" height="3" rx="0.5" fill="white"/>
        <rect x="4" y="38" width="44" height="3" rx="0.5" fill="#f5f5f5"/>
        <rect x="28" y="44" width="20" height="2" rx="0.5" fill="#eee"/>
        <rect x="28" y="47" width="20" height="2" rx="0.5" fill="#eee"/>
        <rect x="28" y="50" width="20" height="4" rx="0.5" fill="#2E9B80"/>
        <rect x="4" y="57" width="22" height="3" rx="0.5" fill="#eee"/>
        <rect width="52" height="8" rx="2" fill="#2D333D" transform="translate(0 60)"/>
        <rect x="10" y="63" width="32" height="2" rx="0.5" fill="#8899AA"/>
      </svg>
    )
  }
  // minimal
  return (
    <svg width="52" height="68" viewBox="0 0 52 68" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="52" height="68" rx="2" fill="white"/>
      <rect x="4" y="4" width="18" height="3" rx="1" fill="#111"/>
      <rect x="4" y="9" width="26" height="2" rx="1" fill="#aaa"/>
      <rect x="30" y="4" width="18" height="4" rx="1" fill="#333" opacity="0.8"/>
      <rect x="30" y="10" width="18" height="2" rx="1" fill="#aaa"/>
      <rect x="4" y="16" width="44" height="0.5" fill="#ccc"/>
      <rect x="4" y="20" width="12" height="2" rx="0.5" fill="#aaa"/>
      <rect x="4" y="24" width="20" height="2" rx="0.5" fill="#333"/>
      <rect x="4" y="28" width="16" height="2" rx="0.5" fill="#333"/>
      <rect x="4" y="34" width="44" height="0.5" fill="#ccc"/>
      <rect x="4" y="38" width="44" height="2" rx="0.5" fill="#aaa"/>
      <rect x="4" y="41" width="44" height="0.3" fill="#ddd"/>
      <rect x="4" y="44" width="44" height="2" rx="0.5" fill="#333"/>
      <rect x="4" y="47" width="44" height="0.3" fill="#ddd"/>
      <rect x="4" y="50" width="44" height="2" rx="0.5" fill="#333"/>
      <rect x="28" y="56" width="20" height="0.5" fill="#333"/>
      <rect x="28" y="59" width="20" height="3" rx="0.5" fill="#111"/>
      <rect x="4" y="64" width="44" height="0.3" fill="#ddd"/>
      <rect x="14" y="66" width="24" height="2" rx="0.5" fill="#aaa"/>
    </svg>
  )
}
