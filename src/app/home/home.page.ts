import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms'; 
import { IonHeader, IonToolbar, IonTitle, IonContent } from '@ionic/angular/standalone';

import { AuthService } from '../services/auth.service';
import { UserService } from '../services/user-info.service';
import { UserProfile } from '../services/user-profile.interface';
import { Subject, of } from 'rxjs';
import { takeUntil, switchMap, tap, take } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [ CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonContent ],
})
export class HomePage implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);
  private userService = inject(UserService);

  allTutors: UserProfile[] = [];
  filteredTutors: UserProfile[] = [];
  
  currentUserUid: string | null = null;
  searchTermMateria: string = '';
  searchTermGrado: string = '';
  isLoading: boolean = true;

  private destroy$ = new Subject<void>();

  constructor() {}

  ngOnInit() {
    this.isLoading = true;
    this.userService.getCurrentUser().pipe(
      take(1),
      switchMap(currentUser => {
        if (currentUser) {
          this.currentUserUid = currentUser.uid;
        }
        return this.userService.getAllUserProfiles();
      }),
      takeUntil(this.destroy$) 
    ).subscribe({
      next: (profiles) => {
        this.allTutors = profiles;
        this.applyFilters(); 
        this.isLoading = false;
      },
      error: (err) => {
        console.error("Error loading user data:", err);
        this.isLoading = false;
      }
    });
  }

  applyFilters() {
    let tutorsToFilter = [...this.allTutors];

    if (this.currentUserUid) {
      tutorsToFilter = tutorsToFilter.filter(tutor => tutor.uid !== this.currentUserUid);
    }

    const materiaQuery = this.searchTermMateria.trim().toLowerCase();
    if (materiaQuery) {
      tutorsToFilter = tutorsToFilter.filter(tutor =>
        tutor.materiasQueDomino.some(materia =>
          materia.toLowerCase().includes(materiaQuery)
        )
      );
    }

    const gradoQuery = this.searchTermGrado.trim().toLowerCase();
    if (gradoQuery) {
      tutorsToFilter = tutorsToFilter.filter(tutor =>
        tutor.grado.toLowerCase().includes(gradoQuery)
      );
    }

    this.filteredTutors = tutorsToFilter;
  }

  search() {
    this.applyFilters();
  }

  logout() {
    this.authService.logout().then(() => {
      this.router.navigateByUrl('/login');
    })
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}