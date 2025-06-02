import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonLabel } from '@ionic/angular/standalone';
import { Subject } from 'rxjs';
import { takeUntil, switchMap } from 'rxjs/operators';

import { UserService } from '../../services/user-info.service'; 
import { UserProfile } from '../../services/user-profile.interface'; 

@Component({
  selector: 'app-users-publics',
  templateUrl: './users-publics.page.html',
  styleUrls: ['./users-publics.page.scss'], 
  standalone: true,
  imports: [
    CommonModule, 
    IonHeader, 
    IonToolbar, 
    IonTitle, 
    IonContent, 
    IonButtons, 
    IonBackButton,
    IonList,
    IonItem,
    IonLabel
  ],
})
export class UsersPublicsPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private userService = inject(UserService);

  tutor: UserProfile | null = null;
  isLoading: boolean = true;
  private tutorId: string | null = null;
  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit() {
    this.isLoading = true;
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      switchMap(params => {
        this.tutorId = params.get('id');
        if (this.tutorId) {
          return this.userService.getUserProfile(this.tutorId);
        }
        return Promise.resolve(null); 
      })
    ).subscribe({
      next: (profile) => {
        if (profile) {
          this.tutor = profile;
        } else {
          console.warn(`Tutor with ID ${this.tutorId} not found.`);
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error loading tutor profile:", err);
        this.isLoading = false;
      }
    });
  }

  goHome() {
    this.router.navigateByUrl('/home');
  }

  goRequest() {
    if (this.tutorId) {
      this.router.navigate(['/request', this.tutorId]);
    } else {
      console.error('Error');
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}