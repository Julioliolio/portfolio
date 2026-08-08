/**
 * Mock address suggestions for the create-plan "add location" search — a
 * spread of recognizable Madrid streets/plazas so the list feels real while
 * staying a pure visual prototype. Pins for address-based plans drop near the
 * current map center (see MapHome), so no coords here.
 */
export type AddressSuggestion = { id: string; label: string; area: string };

export const ADDRESSES: AddressSuggestion[] = [
  { id: 'a-fuencarral', label: 'C. de Fuencarral, 43', area: 'Malasaña, Madrid' },
  { id: 'a-dosdemayo', label: 'Pl. del Dos de Mayo, 1', area: 'Malasaña, Madrid' },
  { id: 'a-palma', label: 'C. de la Palma, 8', area: 'Malasaña, Madrid' },
  { id: 'a-barcelo', label: 'C. de Barceló, 11', area: 'Chueca, Madrid' },
  { id: 'a-chueca', label: 'Pl. de Chueca', area: 'Chueca, Madrid' },
  { id: 'a-cavabaja', label: 'C. de la Cava Baja, 7', area: 'La Latina, Madrid' },
  { id: 'a-rastro', label: 'C. de la Ribera de Curtidores, 12', area: 'El Rastro, Madrid' },
  { id: 'a-debod', label: 'Templo de Debod', area: 'Parque del Oeste, Madrid' },
  { id: 'a-retiro', label: 'Estanque del Retiro', area: 'Parque del Retiro, Madrid' },
  { id: 'a-mayor', label: 'Pl. Mayor, 27', area: 'Sol, Madrid' },
  { id: 'a-riobajo', label: 'Puente de Toledo', area: 'Madrid Río, Madrid' },
  { id: 'a-goya', label: 'C. de Goya, 14', area: 'Salamanca, Madrid' },
];
