import type { Parcel } from '../types'

function parcel(
  apn: string,
  county: string,
  address: string,
  city: string,
  zip: string,
): Parcel {
  return { apn, county, address, city, zip }
}

export const MATCH_PARCELS: Parcel[] = [
  parcel('LA-1142-OAK', 'Los Angeles', '1142 Oakdale Ave', 'La Verne', '91750'),
  parcel('LA-1442-OAK', 'Los Angeles', '1442 Oakdale Ave', 'La Verne', '91750'),
  parcel('LA-1840-OAK', 'Los Angeles', '1840 Oakdale Ave', 'La Verne', '91750'),
  parcel('LA-1852-OAK', 'Los Angeles', '1852 Oakdale Ave', 'La Verne', '91750'),
  parcel('LA-550-N-WES', 'Los Angeles', '550 N Western Ave', 'Los Angeles', '90004'),
  parcel('LA-550-S-WES', 'Los Angeles', '550 S Western Ave', 'Los Angeles', '90004'),
  parcel('LA-100-HWD', 'Los Angeles', '100 Hollywood Blvd', 'Los Angeles', '90028'),
  parcel('LA-742-EVG', 'Los Angeles', '742 Evergreen Ter', 'Burbank', '91501'),
  parcel('OC-415-COM', 'Orange', '415 Commonwealth Ave', 'Fullerton', '92831'),
  parcel('OC-2100-KAT', 'Orange', '2100 E Katella Ave', 'Anaheim', '92806'),
  parcel('OC-88-CIV', 'Orange', '88 Civic Center Dr', 'Santa Ana', '92701'),
  parcel('OC-2500-HAR', 'Orange', '2500 Harbor Blvd', 'Costa Mesa', '92626'),
  parcel('OC-100-ORG', 'Orange', '100 Orange St', 'Orange', '92866'),
  parcel('VE-312-PEN', 'Ventura', '312 Calle Pena', 'Oxnard', '93030'),
  parcel('VE-500-MAIN', 'Ventura', '500 E Main St', 'Ventura', '93001'),
  parcel('VE-50-VEN', 'Ventura', '50 N Ventura Ave', 'Ventura', '93001'),
  parcel('VE-1200-TO', 'Ventura', '1200 Thousand Oaks Blvd', 'Thousand Oaks', '91362'),
  parcel('VE-400-COC', 'Ventura', '400 Cochran St', 'Simi Valley', '93065'),
  parcel('SD-1010-PIER', 'San Diego', '1010 Pier View Way', 'Oceanside', '92054'),
  parcel('SD-4455-MIS', 'San Diego', '4455 Mission Blvd', 'San Diego', '92109'),
  parcel('SD-200-HAR', 'San Diego', '200 Harbor Dr', 'San Diego', '92101'),
  parcel('SD-15-CAM', 'San Diego', '15 Camino Real', 'Carlsbad', '92008'),
  parcel('RV-333-MAIN', 'Riverside', '333 Main St', 'Corona', '92882'),
  parcel('RV-4500-TYL', 'Riverside', '4500 Tyler St', 'Riverside', '92503'),
  parcel('RV-100-IND', 'Riverside', '100 N Indian Canyon Dr', 'Palm Springs', '92262'),
  parcel('SB-200-ARR', 'San Bernardino', '200 Arrow Hwy', 'Upland', '91786'),
  parcel('SB-850-HAV', 'San Bernardino', '850 E Haven Ave', 'Rancho Cucamonga', '91730'),
  parcel('SB-421-ORG', 'San Bernardino', '421 Orange St', 'Redlands', '92373'),
  parcel('SB-900-FON', 'San Bernardino', '900 Sierra Ave', 'Fontana', '92335'),
]
