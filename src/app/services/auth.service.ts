import { Injectable } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut,
sendPasswordResetEmail } from '@angular/fire/auth';
import {  User, onAuthStateChanged } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  constructor(private auth: Auth) {}


 
    async getCurrentUser(): Promise<User | null> {
      return new Promise((resolve) => {
        onAuthStateChanged(this.auth, (user) => {
          resolve(user);
        });
      });
    }


  async register(email: string, password: string) {
    return await createUserWithEmailAndPassword(this.auth, email, password);
  }


  async login(email: string, password: string) {
    return await signInWithEmailAndPassword(this.auth, email, password);
  }


  async resetPassword(email: string) {
    return await sendPasswordResetEmail(this.auth, email);
  }


  async logout() {
    return await signOut(this.auth);
  }
}
