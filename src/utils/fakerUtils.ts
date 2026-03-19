import { faker } from '@faker-js/faker';

export const generateUser = () => ({
  socialTitle: 'Mr.',
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  email: faker.internet.email(),
  password: faker.internet.password({ length: 10 }),
  birthDate: faker.date.birthdate({ min: 18, max: 80, mode: 'age' }).toLocaleDateString('en-US'),
  receiveOffers: faker.datatype.boolean(),
  agreeTerms: true,
  newsletter: faker.datatype.boolean(),
});