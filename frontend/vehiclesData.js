// Comprehensive Vehicle Database for DriveLogic
export const YEARS = Array.from({ length: 37 }, (_, i) => String(2026 - i));

export const VEHICLE_MAKES = [
  {
    name: 'Acura',
    models: ['MDX', 'RDX', 'TLX', 'Integra', 'ILX', 'TSX', 'TL', 'Other']
  },
  {
    name: 'Alfa Romeo',
    models: ['Giulia', 'Stelvio', 'Tonale', '4C', 'Other']
  },
  {
    name: 'Audi',
    models: ['A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'Q3', 'Q5', 'Q7', 'Q8', 'e-tron', 'S4', 'S5', 'Other']
  },
  {
    name: 'BMW',
    models: ['3 Series', '4 Series', '5 Series', '7 Series', 'X1', 'X3', 'X5', 'X7', 'M3', 'M5', 'Z4', 'i4', 'Other']
  },
  {
    name: 'Buick',
    models: ['Enclave', 'Encore', 'Encore GX', 'Envision', 'LaCrosse', 'Regal', 'Other']
  },
  {
    name: 'Cadillac',
    models: ['Escalade', 'CT4', 'CT5', 'XT4', 'XT5', 'XT6', 'Lyriq', 'CTS', 'ATS', 'Other']
  },
  {
    name: 'Chevrolet',
    models: ['Silverado 1500', 'Silverado 2500', 'Malibu', 'Equinox', 'Tahoe', 'Suburban', 'Traverse', 'Colorado', 'Corvette', 'Camaro', 'Blazer', 'Trax', 'Other']
  },
  {
    name: 'Chrysler',
    models: ['Pacifica', '300', 'Voyager', 'Town & Country', 'Other']
  },
  {
    name: 'Dodge',
    models: ['Charger', 'Challenger', 'Durango', 'Hornet', 'Grand Caravan', 'Journey', 'Other']
  },
  {
    name: 'Ford',
    models: ['F-150', 'F-250 Super Duty', 'Explorer', 'Escape', 'Mustang', 'Bronco', 'Bronco Sport', 'Edge', 'Ranger', 'Expedition', 'Maverick', 'Fusion', 'Other']
  },
  {
    name: 'Genesis',
    models: ['G70', 'G80', 'G90', 'GV70', 'GV80', 'GV60', 'Other']
  },
  {
    name: 'GMC',
    models: ['Sierra 1500', 'Sierra 2500', 'Yukon', 'Yukon XL', 'Acadia', 'Terrain', 'Canyon', 'Other']
  },
  {
    name: 'Honda',
    models: ['Accord', 'Civic', 'CR-V', 'Pilot', 'HR-V', 'Passport', 'Odyssey', 'Ridgeline', 'Fit', 'Other']
  },
  {
    name: 'Hyundai',
    models: ['Elantra', 'Sonata', 'Tucson', 'Santa Fe', 'Palisade', 'Kona', 'Ioniq 5', 'Venue', 'Santa Cruz', 'Other']
  },
  {
    name: 'Infiniti',
    models: ['Q50', 'Q60', 'QX50', 'QX55', 'QX60', 'QX80', 'G37', 'Other']
  },
  {
    name: 'Jaguar',
    models: ['F-PACE', 'E-PACE', 'F-TYPE', 'XF', 'XE', 'I-PACE', 'Other']
  },
  {
    name: 'Jeep',
    models: ['Wrangler', 'Grand Cherokee', 'Cherokee', 'Compass', 'Gladiator', 'Renegade', 'Wagoneer', 'Other']
  },
  {
    name: 'Kia',
    models: ['Forte', 'K5', 'Sportage', 'Sorento', 'Telluride', 'Soul', 'EV6', 'Carnival', 'Seltos', 'Optima', 'Other']
  },
  {
    name: 'Land Rover',
    models: ['Range Rover', 'Range Rover Sport', 'Range Rover Velar', 'Range Rover Evoque', 'Defender', 'Discovery', 'Discovery Sport', 'Other']
  },
  {
    name: 'Lexus',
    models: ['RX 350', 'ES 350', 'NX 300', 'GX 460', 'IS 300', 'IS 350', 'TX', 'LX 600', 'UX', 'LS 500', 'Other']
  },
  {
    name: 'Lincoln',
    models: ['Navigator', 'Aviator', 'Nautilus', 'Corsair', 'MKZ', 'MKX', 'Other']
  },
  {
    name: 'Mazda',
    models: ['CX-5', 'CX-30', 'CX-50', 'CX-90', 'Mazda3', 'Mazda6', 'MX-5 Miata', 'Other']
  },
  {
    name: 'Mercedes-Benz',
    models: ['C-Class', 'E-Class', 'S-Class', 'GLC', 'GLE', 'GLS', 'CLA', 'A-Class', 'GLA', 'GLB', 'G-Class', 'EQE', 'EQS', 'Other']
  },
  {
    name: 'MINI',
    models: ['Cooper Hardtop', 'Countryman', 'Clubman', 'Cooper Convertible', 'Other']
  },
  {
    name: 'Mitsubishi',
    models: ['Outlander', 'Outlander Sport', 'Eclipse Cross', 'Mirage', 'Other']
  },
  {
    name: 'Nissan',
    models: ['Altima', 'Rogue', 'Sentra', 'Pathfinder', 'Frontier', 'Murano', 'Titan', 'Maxima', 'Kicks', 'Armada', 'Other']
  },
  {
    name: 'Porsche',
    models: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan', '718 Cayman', '718 Boxster', 'Other']
  },
  {
    name: 'Ram',
    models: ['1500', '2500', '3500', 'ProMaster', 'Other']
  },
  {
    name: 'Subaru',
    models: ['Outback', 'Forester', 'Crosstrek', 'Ascent', 'Impreza', 'Legacy', 'WRX', 'BRZ', 'Other']
  },
  {
    name: 'Tesla',
    models: ['Model 3', 'Model Y', 'Model S', 'Model X', 'Cybertruck', 'Other']
  },
  {
    name: 'Toyota',
    models: ['Camry', 'Corolla', 'RAV4', 'Highlander', 'Tacoma', 'Tundra', '4Runner', 'Prius', 'Sienna', 'Grand Highlander', 'Venza', 'Corolla Cross', 'Sequoia', 'Other']
  },
  {
    name: 'Volkswagen',
    models: ['Jetta', 'Tiguan', 'Atlas', 'Atlas Cross Sport', 'Golf', 'Golf GTI', 'Taos', 'Passat', 'ID.4', 'Other']
  },
  {
    name: 'Volvo',
    models: ['XC90', 'XC60', 'XC40', 'S60', 'S90', 'V60', 'V90', 'Other']
  },
  {
    name: 'Other / Custom Make',
    models: ['Other']
  }
];
