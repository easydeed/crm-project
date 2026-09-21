import { expect, test } from 'vitest'
import {
  applyMapping,
  detectColumns,
  mappingIsComplete,
  roleForHeader,
} from '@/import/detect-columns'

test('detects listed header variants', () => {
  expect(roleForHeader('Name')).toBe('name')
  expect(roleForHeader('Full Name')).toBe('name')
  expect(roleForHeader('First')).toBe('first')
  expect(roleForHeader('Last')).toBe('last')
  expect(roleForHeader('Email')).toBe('email')
  expect(roleForHeader('E-mail')).toBe('email')
  expect(roleForHeader('Address')).toBe('address')
  expect(roleForHeader('Street')).toBe('street')
  expect(roleForHeader('City')).toBe('city')
  expect(roleForHeader('Zip')).toBe('zip')
  expect(roleForHeader('close date')).toBe('closeDate')
})

test('Name + Email + Address is confident', () => {
  const detected = detectColumns(['Name', 'Email', 'Address', 'Close Date'])
  expect(detected.confident).toBe(true)
  expect(detected.mapping).toEqual(['name', 'email', 'address', 'closeDate'])
})

test('Full Name and E-mail and Address is confident', () => {
  expect(detectColumns(['Full Name', 'E-mail', 'Address']).confident).toBe(true)
})

test('First + Last with Street + City + Zip is confident', () => {
  const detected = detectColumns(['First', 'Last', 'Email', 'Street', 'City', 'Zip'])
  expect(detected.confident).toBe(true)
  const [row] = applyMapping(
    [detected.mapping, ['Maya', 'Chen', 'maya@example.com', '1840 Oakdale Ave', 'La Verne', '91750']],
    detected.mapping,
    true,
  )
  expect(row.name).toBe('Maya Chen')
  expect(row.address).toBe('1840 Oakdale Ave, La Verne, 91750')
})

test('unknown headers are not confident', () => {
  const detected = detectColumns(['Col A', 'Col B', 'Col C'])
  expect(detected.confident).toBe(false)
  expect(mappingIsComplete(detected.mapping)).toBe(false)
})
