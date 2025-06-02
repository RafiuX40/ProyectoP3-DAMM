import { Injectable, inject, runInInjectionContext, Injector } from '@angular/core';
import { Firestore, doc, docData, updateDoc, setDoc, collection, collectionData, getDoc } from '@angular/fire/firestore';
import { Auth, user, User as AuthUser } from '@angular/fire/auth';
import { Observable, of, firstValueFrom } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { UserProfile } from './user-profile.interface';

@Injectable({ providedIn: 'root' })
export class UserService {
  private firestore = inject(Firestore);
  private auth = inject(Auth);
  private injector = inject(Injector); 

  async createUserProfile(userId: string, data: Omit<UserProfile, 'uid'>): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    const profileToSave: UserProfile = {
      ...data,
      uid: userId,
      averageRating: typeof data.averageRating === 'number' ? data.averageRating : 0,
      ratingCount: typeof data.ratingCount === 'number' ? data.ratingCount : 0,
    };
    return setDoc(userRef, profileToSave);
  }

  getUserProfile(userId: string): Observable<UserProfile | null> {
    console.log(`UserService: getUserProfile called for userId: ${userId}`); 
    return runInInjectionContext(this.injector, () => {
      const userRef = doc(this.firestore, `users/${userId}`);
      return (docData(userRef, { idField: 'uid' }) as Observable<UserProfile | null>).pipe(
        tap(profile => console.log(`UserService: getUserProfile emitting for ${userId}:`, profile)), 
        take(1)
      );
    });
  }

  getAllUserProfiles(): Observable<UserProfile[]> {
    return runInInjectionContext(this.injector, () => {
        const usersCollection = collection(this.firestore, 'users');
        return collectionData(usersCollection, { idField: 'uid' }) as Observable<UserProfile[]>;
    });
  }

  updateUserProfile(userId: string, data: Partial<UserProfile>): Promise<void> {
    const userRef = doc(this.firestore, `users/${userId}`);
    return updateDoc(userRef, data);
  }

  getCurrentUser(): Observable<UserProfile | null> {
    console.log(`UserService: getCurrentUser called`);
    return runInInjectionContext(this.injector, () => {
      return user(this.auth).pipe(
        take(1), 
        tap(authUser => console.log(`UserService: getCurrentUser - authUser state:`, authUser)), 
        switchMap((authUser: AuthUser | null) => {
          if (authUser) {
            console.log(`UserService: getCurrentUser - authUser found, fetching profile for UID: ${authUser.uid}`); 
            return this.getUserProfile(authUser.uid); 
          } else {
            console.log(`UserService: getCurrentUser - no authUser, returning of(null)`); 
            return of(null); 
          }
        })
      );
    });
  }

  async rateTutor(tutorId: string, rating: number): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const tutorRef = doc(this.firestore, `users/${tutorId}`);
      
      const currentData = await firstValueFrom(
        (docData(tutorRef) as Observable<UserProfile | null | undefined>).pipe(take(1))
      );

      const currentAverage = currentData?.averageRating || 0;
      const currentCount = currentData?.ratingCount || 0;

      const newCount = currentCount + 1;
      const newAverage = (currentCount === 0 && newCount === 1) 
                         ? rating 
                         : (((currentAverage * currentCount) + rating) / newCount);

      return updateDoc(tutorRef, {
        averageRating: newAverage,
        ratingCount: newCount
      });
    });
  }
}