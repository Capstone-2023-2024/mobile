import firebase from '@react-native-firebase/app';
import firestore from '@react-native-firebase/firestore';
import auth from '@react-native-firebase/auth';
import {ResultType} from 'cics-mobile-client/../../shared/types';

const app = firebase.app();

export const firestoreApp = firestore(app);
export const authApp = auth(app);

export const validateEmail = (email: string) => {
  const emailRegex = /^[A-Za-z0-9]+(\.[A-Za-z0-9]+)*@bulsu\.edu\.ph$/;
  return emailRegex.test(email);
};

export function validateEmailWithCOR(result: ResultType) {
  const {name, type} = result;
  const lastNameEndex = name.indexOf(',') ?? NaN;
  const initialDotStart = name.indexOf('.') ?? NaN;
  let middleInitial = name
    .substring(initialDotStart - 1, initialDotStart)
    .trim()
    .toLowerCase();
  const firstName = name
    .substring(lastNameEndex + 1, initialDotStart - 1)
    .trim()
    .toLowerCase();
  const lastName = name.substring(0, lastNameEndex).trim().toLowerCase();
  const initialDotEnd = name.lastIndexOf('.') ?? NaN;
  if (initialDotEnd !== initialDotStart) {
    middleInitial = name.substring(initialDotStart - 1, initialDotEnd);
  }

  if (type === 'first') return firstName;
  else if (type === 'last') return lastName;
  else if (type === 'initial') return middleInitial;
  return `${firstName.replace(
    / /g,
    '',
  )}.${lastName}.${middleInitial}@bulsu.edu.ph`;
}
