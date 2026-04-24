'use client';

import { useState, useEffect } from 'react';

const COUNTRIES = [
  { code: 'PE', dial: '+51',  flag: '🇵🇪', name: 'Perú' },
  { code: 'AF', dial: '+93',  flag: '🇦🇫', name: 'Afganistán' },
  { code: 'AL', dial: '+355', flag: '🇦🇱', name: 'Albania' },
  { code: 'DE', dial: '+49',  flag: '🇩🇪', name: 'Alemania' },
  { code: 'AD', dial: '+376', flag: '🇦🇩', name: 'Andorra' },
  { code: 'AO', dial: '+244', flag: '🇦🇴', name: 'Angola' },
  { code: 'AG', dial: '+1',   flag: '🇦🇬', name: 'Antigua y Barbuda' },
  { code: 'SA', dial: '+966', flag: '🇸🇦', name: 'Arabia Saudita' },
  { code: 'DZ', dial: '+213', flag: '🇩🇿', name: 'Argelia' },
  { code: 'AR', dial: '+54',  flag: '🇦🇷', name: 'Argentina' },
  { code: 'AM', dial: '+374', flag: '🇦🇲', name: 'Armenia' },
  { code: 'AU', dial: '+61',  flag: '🇦🇺', name: 'Australia' },
  { code: 'AT', dial: '+43',  flag: '🇦🇹', name: 'Austria' },
  { code: 'AZ', dial: '+994', flag: '🇦🇿', name: 'Azerbaiyán' },
  { code: 'BS', dial: '+1',   flag: '🇧🇸', name: 'Bahamas' },
  { code: 'BH', dial: '+973', flag: '🇧🇭', name: 'Baréin' },
  { code: 'BD', dial: '+880', flag: '🇧🇩', name: 'Bangladés' },
  { code: 'BB', dial: '+1',   flag: '🇧🇧', name: 'Barbados' },
  { code: 'BE', dial: '+32',  flag: '🇧🇪', name: 'Bélgica' },
  { code: 'BZ', dial: '+501', flag: '🇧🇿', name: 'Belice' },
  { code: 'BJ', dial: '+229', flag: '🇧🇯', name: 'Benín' },
  { code: 'BY', dial: '+375', flag: '🇧🇾', name: 'Bielorrusia' },
  { code: 'MM', dial: '+95',  flag: '🇲🇲', name: 'Birmania' },
  { code: 'BO', dial: '+591', flag: '🇧🇴', name: 'Bolivia' },
  { code: 'BA', dial: '+387', flag: '🇧🇦', name: 'Bosnia y Herzegovina' },
  { code: 'BW', dial: '+267', flag: '🇧🇼', name: 'Botsuana' },
  { code: 'BR', dial: '+55',  flag: '🇧🇷', name: 'Brasil' },
  { code: 'BN', dial: '+673', flag: '🇧🇳', name: 'Brunéi' },
  { code: 'BG', dial: '+359', flag: '🇧🇬', name: 'Bulgaria' },
  { code: 'BF', dial: '+226', flag: '🇧🇫', name: 'Burkina Faso' },
  { code: 'BI', dial: '+257', flag: '🇧🇮', name: 'Burundi' },
  { code: 'BT', dial: '+975', flag: '🇧🇹', name: 'Bután' },
  { code: 'CV', dial: '+238', flag: '🇨🇻', name: 'Cabo Verde' },
  { code: 'KH', dial: '+855', flag: '🇰🇭', name: 'Camboya' },
  { code: 'CM', dial: '+237', flag: '🇨🇲', name: 'Camerún' },
  { code: 'CA', dial: '+1',   flag: '🇨🇦', name: 'Canadá' },
  { code: 'QA', dial: '+974', flag: '🇶🇦', name: 'Catar' },
  { code: 'TD', dial: '+235', flag: '🇹🇩', name: 'Chad' },
  { code: 'CL', dial: '+56',  flag: '🇨🇱', name: 'Chile' },
  { code: 'CN', dial: '+86',  flag: '🇨🇳', name: 'China' },
  { code: 'CY', dial: '+357', flag: '🇨🇾', name: 'Chipre' },
  { code: 'VA', dial: '+39',  flag: '🇻🇦', name: 'Ciudad del Vaticano' },
  { code: 'CO', dial: '+57',  flag: '🇨🇴', name: 'Colombia' },
  { code: 'KM', dial: '+269', flag: '🇰🇲', name: 'Comoras' },
  { code: 'CG', dial: '+242', flag: '🇨🇬', name: 'Congo' },
  { code: 'CD', dial: '+243', flag: '🇨🇩', name: 'Congo (RD)' },
  { code: 'KP', dial: '+850', flag: '🇰🇵', name: 'Corea del Norte' },
  { code: 'KR', dial: '+82',  flag: '🇰🇷', name: 'Corea del Sur' },
  { code: 'CR', dial: '+506', flag: '🇨🇷', name: 'Costa Rica' },
  { code: 'CI', dial: '+225', flag: '🇨🇮', name: "Costa de Marfil" },
  { code: 'HR', dial: '+385', flag: '🇭🇷', name: 'Croacia' },
  { code: 'CU', dial: '+53',  flag: '🇨🇺', name: 'Cuba' },
  { code: 'DK', dial: '+45',  flag: '🇩🇰', name: 'Dinamarca' },
  { code: 'DJ', dial: '+253', flag: '🇩🇯', name: 'Yibuti' },
  { code: 'DM', dial: '+1',   flag: '🇩🇲', name: 'Dominica' },
  { code: 'EC', dial: '+593', flag: '🇪🇨', name: 'Ecuador' },
  { code: 'EG', dial: '+20',  flag: '🇪🇬', name: 'Egipto' },
  { code: 'SV', dial: '+503', flag: '🇸🇻', name: 'El Salvador' },
  { code: 'AE', dial: '+971', flag: '🇦🇪', name: 'Emiratos Árabes' },
  { code: 'ER', dial: '+291', flag: '🇪🇷', name: 'Eritrea' },
  { code: 'SK', dial: '+421', flag: '🇸🇰', name: 'Eslovaquia' },
  { code: 'SI', dial: '+386', flag: '🇸🇮', name: 'Eslovenia' },
  { code: 'ES', dial: '+34',  flag: '🇪🇸', name: 'España' },
  { code: 'US', dial: '+1',   flag: '🇺🇸', name: 'Estados Unidos' },
  { code: 'EE', dial: '+372', flag: '🇪🇪', name: 'Estonia' },
  { code: 'ET', dial: '+251', flag: '🇪🇹', name: 'Etiopía' },
  { code: 'PH', dial: '+63',  flag: '🇵🇭', name: 'Filipinas' },
  { code: 'FI', dial: '+358', flag: '🇫🇮', name: 'Finlandia' },
  { code: 'FJ', dial: '+679', flag: '🇫🇯', name: 'Fiyi' },
  { code: 'FR', dial: '+33',  flag: '🇫🇷', name: 'Francia' },
  { code: 'GA', dial: '+241', flag: '🇬🇦', name: 'Gabón' },
  { code: 'GM', dial: '+220', flag: '🇬🇲', name: 'Gambia' },
  { code: 'GE', dial: '+995', flag: '🇬🇪', name: 'Georgia' },
  { code: 'GH', dial: '+233', flag: '🇬🇭', name: 'Ghana' },
  { code: 'GD', dial: '+1',   flag: '🇬🇩', name: 'Granada' },
  { code: 'GR', dial: '+30',  flag: '🇬🇷', name: 'Grecia' },
  { code: 'GT', dial: '+502', flag: '🇬🇹', name: 'Guatemala' },
  { code: 'GN', dial: '+224', flag: '🇬🇳', name: 'Guinea' },
  { code: 'GQ', dial: '+240', flag: '🇬🇶', name: 'Guinea Ecuatorial' },
  { code: 'GW', dial: '+245', flag: '🇬🇼', name: 'Guinea-Bisáu' },
  { code: 'GY', dial: '+592', flag: '🇬🇾', name: 'Guyana' },
  { code: 'HT', dial: '+509', flag: '🇭🇹', name: 'Haití' },
  { code: 'HN', dial: '+504', flag: '🇭🇳', name: 'Honduras' },
  { code: 'HU', dial: '+36',  flag: '🇭🇺', name: 'Hungría' },
  { code: 'IN', dial: '+91',  flag: '🇮🇳', name: 'India' },
  { code: 'ID', dial: '+62',  flag: '🇮🇩', name: 'Indonesia' },
  { code: 'IQ', dial: '+964', flag: '🇮🇶', name: 'Irak' },
  { code: 'IR', dial: '+98',  flag: '🇮🇷', name: 'Irán' },
  { code: 'IE', dial: '+353', flag: '🇮🇪', name: 'Irlanda' },
  { code: 'IS', dial: '+354', flag: '🇮🇸', name: 'Islandia' },
  { code: 'MH', dial: '+692', flag: '🇲🇭', name: 'Islas Marshall' },
  { code: 'SB', dial: '+677', flag: '🇸🇧', name: 'Islas Salomón' },
  { code: 'IL', dial: '+972', flag: '🇮🇱', name: 'Israel' },
  { code: 'IT', dial: '+39',  flag: '🇮🇹', name: 'Italia' },
  { code: 'JM', dial: '+1',   flag: '🇯🇲', name: 'Jamaica' },
  { code: 'JP', dial: '+81',  flag: '🇯🇵', name: 'Japón' },
  { code: 'JO', dial: '+962', flag: '🇯🇴', name: 'Jordania' },
  { code: 'KZ', dial: '+7',   flag: '🇰🇿', name: 'Kazajistán' },
  { code: 'KE', dial: '+254', flag: '🇰🇪', name: 'Kenia' },
  { code: 'KG', dial: '+996', flag: '🇰🇬', name: 'Kirguistán' },
  { code: 'KI', dial: '+686', flag: '🇰🇮', name: 'Kiribati' },
  { code: 'KW', dial: '+965', flag: '🇰🇼', name: 'Kuwait' },
  { code: 'LA', dial: '+856', flag: '🇱🇦', name: 'Laos' },
  { code: 'LS', dial: '+266', flag: '🇱🇸', name: 'Lesoto' },
  { code: 'LV', dial: '+371', flag: '🇱🇻', name: 'Letonia' },
  { code: 'LB', dial: '+961', flag: '🇱🇧', name: 'Líbano' },
  { code: 'LR', dial: '+231', flag: '🇱🇷', name: 'Liberia' },
  { code: 'LY', dial: '+218', flag: '🇱🇾', name: 'Libia' },
  { code: 'LI', dial: '+423', flag: '🇱🇮', name: 'Liechtenstein' },
  { code: 'LT', dial: '+370', flag: '🇱🇹', name: 'Lituania' },
  { code: 'LU', dial: '+352', flag: '🇱🇺', name: 'Luxemburgo' },
  { code: 'MK', dial: '+389', flag: '🇲🇰', name: 'Macedonia del Norte' },
  { code: 'MG', dial: '+261', flag: '🇲🇬', name: 'Madagascar' },
  { code: 'MY', dial: '+60',  flag: '🇲🇾', name: 'Malasia' },
  { code: 'MW', dial: '+265', flag: '🇲🇼', name: 'Malaui' },
  { code: 'MV', dial: '+960', flag: '🇲🇻', name: 'Maldivas' },
  { code: 'ML', dial: '+223', flag: '🇲🇱', name: 'Malí' },
  { code: 'MT', dial: '+356', flag: '🇲🇹', name: 'Malta' },
  { code: 'MA', dial: '+212', flag: '🇲🇦', name: 'Marruecos' },
  { code: 'MU', dial: '+230', flag: '🇲🇺', name: 'Mauricio' },
  { code: 'MR', dial: '+222', flag: '🇲🇷', name: 'Mauritania' },
  { code: 'MX', dial: '+52',  flag: '🇲🇽', name: 'México' },
  { code: 'FM', dial: '+691', flag: '🇫🇲', name: 'Micronesia' },
  { code: 'MD', dial: '+373', flag: '🇲🇩', name: 'Moldavia' },
  { code: 'MC', dial: '+377', flag: '🇲🇨', name: 'Mónaco' },
  { code: 'MN', dial: '+976', flag: '🇲🇳', name: 'Mongolia' },
  { code: 'ME', dial: '+382', flag: '🇲🇪', name: 'Montenegro' },
  { code: 'MZ', dial: '+258', flag: '🇲🇿', name: 'Mozambique' },
  { code: 'NA', dial: '+264', flag: '🇳🇦', name: 'Namibia' },
  { code: 'NR', dial: '+674', flag: '🇳🇷', name: 'Nauru' },
  { code: 'NP', dial: '+977', flag: '🇳🇵', name: 'Nepal' },
  { code: 'NI', dial: '+505', flag: '🇳🇮', name: 'Nicaragua' },
  { code: 'NE', dial: '+227', flag: '🇳🇪', name: 'Níger' },
  { code: 'NG', dial: '+234', flag: '🇳🇬', name: 'Nigeria' },
  { code: 'NO', dial: '+47',  flag: '🇳🇴', name: 'Noruega' },
  { code: 'NZ', dial: '+64',  flag: '🇳🇿', name: 'Nueva Zelanda' },
  { code: 'OM', dial: '+968', flag: '🇴🇲', name: 'Omán' },
  { code: 'NL', dial: '+31',  flag: '🇳🇱', name: 'Países Bajos' },
  { code: 'PK', dial: '+92',  flag: '🇵🇰', name: 'Pakistán' },
  { code: 'PW', dial: '+680', flag: '🇵🇼', name: 'Palaos' },
  { code: 'PA', dial: '+507', flag: '🇵🇦', name: 'Panamá' },
  { code: 'PG', dial: '+675', flag: '🇵🇬', name: 'Papúa Nueva Guinea' },
  { code: 'PY', dial: '+595', flag: '🇵🇾', name: 'Paraguay' },
  { code: 'PL', dial: '+48',  flag: '🇵🇱', name: 'Polonia' },
  { code: 'PT', dial: '+351', flag: '🇵🇹', name: 'Portugal' },
  { code: 'GB', dial: '+44',  flag: '🇬🇧', name: 'Reino Unido' },
  { code: 'CF', dial: '+236', flag: '🇨🇫', name: 'Rep. Centroafricana' },
  { code: 'CZ', dial: '+420', flag: '🇨🇿', name: 'Rep. Checa' },
  { code: 'DO', dial: '+1',   flag: '🇩🇴', name: 'Rep. Dominicana' },
  { code: 'RW', dial: '+250', flag: '🇷🇼', name: 'Ruanda' },
  { code: 'RO', dial: '+40',  flag: '🇷🇴', name: 'Rumanía' },
  { code: 'RU', dial: '+7',   flag: '🇷🇺', name: 'Rusia' },
  { code: 'WS', dial: '+685', flag: '🇼🇸', name: 'Samoa' },
  { code: 'KN', dial: '+1',   flag: '🇰🇳', name: 'San Cristóbal y Nieves' },
  { code: 'SM', dial: '+378', flag: '🇸🇲', name: 'San Marino' },
  { code: 'VC', dial: '+1',   flag: '🇻🇨', name: 'San Vicente y Granadinas' },
  { code: 'LC', dial: '+1',   flag: '🇱🇨', name: 'Santa Lucía' },
  { code: 'ST', dial: '+239', flag: '🇸🇹', name: 'Santo Tomé y Príncipe' },
  { code: 'SN', dial: '+221', flag: '🇸🇳', name: 'Senegal' },
  { code: 'RS', dial: '+381', flag: '🇷🇸', name: 'Serbia' },
  { code: 'SC', dial: '+248', flag: '🇸🇨', name: 'Seychelles' },
  { code: 'SL', dial: '+232', flag: '🇸🇱', name: 'Sierra Leona' },
  { code: 'SG', dial: '+65',  flag: '🇸🇬', name: 'Singapur' },
  { code: 'SY', dial: '+963', flag: '🇸🇾', name: 'Siria' },
  { code: 'SO', dial: '+252', flag: '🇸🇴', name: 'Somalia' },
  { code: 'LK', dial: '+94',  flag: '🇱🇰', name: 'Sri Lanka' },
  { code: 'SZ', dial: '+268', flag: '🇸🇿', name: 'Suazilandia' },
  { code: 'ZA', dial: '+27',  flag: '🇿🇦', name: 'Sudáfrica' },
  { code: 'SD', dial: '+249', flag: '🇸🇩', name: 'Sudán' },
  { code: 'SS', dial: '+211', flag: '🇸🇸', name: 'Sudán del Sur' },
  { code: 'SE', dial: '+46',  flag: '🇸🇪', name: 'Suecia' },
  { code: 'CH', dial: '+41',  flag: '🇨🇭', name: 'Suiza' },
  { code: 'SR', dial: '+597', flag: '🇸🇷', name: 'Surinam' },
  { code: 'TH', dial: '+66',  flag: '🇹🇭', name: 'Tailandia' },
  { code: 'TZ', dial: '+255', flag: '🇹🇿', name: 'Tanzania' },
  { code: 'TJ', dial: '+992', flag: '🇹🇯', name: 'Tayikistán' },
  { code: 'TL', dial: '+670', flag: '🇹🇱', name: 'Timor Oriental' },
  { code: 'TG', dial: '+228', flag: '🇹🇬', name: 'Togo' },
  { code: 'TO', dial: '+676', flag: '🇹🇴', name: 'Tonga' },
  { code: 'TT', dial: '+1',   flag: '🇹🇹', name: 'Trinidad y Tobago' },
  { code: 'TN', dial: '+216', flag: '🇹🇳', name: 'Túnez' },
  { code: 'TM', dial: '+993', flag: '🇹🇲', name: 'Turkmenistán' },
  { code: 'TR', dial: '+90',  flag: '🇹🇷', name: 'Turquía' },
  { code: 'TV', dial: '+688', flag: '🇹🇻', name: 'Tuvalu' },
  { code: 'UA', dial: '+380', flag: '🇺🇦', name: 'Ucrania' },
  { code: 'UG', dial: '+256', flag: '🇺🇬', name: 'Uganda' },
  { code: 'UY', dial: '+598', flag: '🇺🇾', name: 'Uruguay' },
  { code: 'UZ', dial: '+998', flag: '🇺🇿', name: 'Uzbekistán' },
  { code: 'VU', dial: '+678', flag: '🇻🇺', name: 'Vanuatu' },
  { code: 'VE', dial: '+58',  flag: '🇻🇪', name: 'Venezuela' },
  { code: 'VN', dial: '+84',  flag: '🇻🇳', name: 'Vietnam' },
  { code: 'YE', dial: '+967', flag: '🇾🇪', name: 'Yemen' },
  { code: 'ZM', dial: '+260', flag: '🇿🇲', name: 'Zambia' },
  { code: 'ZW', dial: '+263', flag: '🇿🇼', name: 'Zimbabue' },
];

const DEFAULT_DIAL = '+51';

function splitPhone(value: string): { dial: string; number: string } {
  const sorted = [...COUNTRIES].sort((a, b) => b.dial.length - a.dial.length);
  const country = sorted.find(c => value.startsWith(c.dial));
  if (country) {
    return { dial: country.dial, number: value.slice(country.dial.length).trimStart() };
  }
  return { dial: DEFAULT_DIAL, number: value };
}

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder = '999 999 999', className = '' }: PhoneInputProps) {
  const [dial, setDial] = useState(DEFAULT_DIAL);
  const [number, setNumber] = useState('');

  useEffect(() => {
    const split = splitPhone(value ?? '');
    setDial(split.dial);
    setNumber(split.number);
  }, []);

  const handleDialChange = (newDial: string) => {
    setDial(newDial);
    onChange(`${newDial} ${number}`.trim());
  };

  const handleNumberChange = (raw: string) => {
    setNumber(raw);
    onChange(`${dial} ${raw}`.trim());
  };

  const baseCls = 'border border-bone-200 rounded-xl text-sm bg-white text-khaki-900 focus:outline-none focus:ring-2 focus:ring-gold-400';

  return (
    <div className="flex gap-1.5">
      <select
        value={dial}
        onChange={e => handleDialChange(e.target.value)}
        className={`${baseCls} px-2 py-3 flex-shrink-0 w-[90px] cursor-pointer`}
      >
        {COUNTRIES.map(c => (
          <option key={c.code} value={c.dial}>
            {c.flag} {c.dial}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={number}
        onChange={e => handleNumberChange(e.target.value)}
        placeholder={placeholder}
        className={`${baseCls} px-3.5 py-3 flex-1 min-w-0 ${className}`}
      />
    </div>
  );
}
