import { firestore } from '../services/firebase';
import { collection, addDoc, Timestamp } from 'firebase/firestore';

export async function sendNotification(userId: string, title: string, message: string) {
  try {
    await addDoc(collection(firestore, 'notifications'), {
      userId,
      title,
      message,
      date: Timestamp.now(),
      read: false,
    });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    return false;
  }
}
