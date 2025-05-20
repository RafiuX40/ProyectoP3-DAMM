// src/app/pages/request/request.page.ts (or your actual path)
import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';
import { Subject, forkJoin, of } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';

import { TutorService } from '../../services/tutor.service'; // Adjust path if necessary
import { UserService } from '../../services/user-info.service'; // Adjust path if necessary
import { UserProfile } from '../../services/user-profile.interface'; // Adjust path if necessary
import { TutoringRequest } from '../../services/tutoring-request.interface'; // Adjust path if necessary

@Component({
  selector: 'app-request',
  templateUrl: './request.page.html',
  styleUrls: ['./request.page.scss'], // Make sure this path is correct or remove if no specific styles
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton,
    IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption,
    IonButton, IonDatetime, IonDatetimeButton, IonModal, DatePipe
  ],
})
export class RequestPage implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private tutorService = inject(TutorService);
  private userService = inject(UserService);
  private alertController = inject(AlertController);

  requestForm!: FormGroup;
  tutor: UserProfile | null = null;
  currentUser: UserProfile | null = null;
  isLoading: boolean = true;
  
  public tutorId: string | null = null;
  private destroy$ = new Subject<void>();

  public minDateValue: string;

  constructor() {
    const now = new Date();
    this.minDateValue = this.formatDateToYYYYMMDD(now);

    this.requestForm = this.fb.group({
      subject: ['', Validators.required],
      date: [this.formatDateToYYYYMMDD(now), Validators.required], // Stores as YYYY-MM-DD
      time: [now.toISOString(), Validators.required], // Stores as full ISO string for ion-datetime
      mode: ['virtual', Validators.required],
      location: [''],
      notes: [''],
    });

    this.requestForm.get('mode')?.valueChanges.subscribe(mode => {
      const locationControl = this.requestForm.get('location');
      if (mode === 'presencial') {
        locationControl?.setValidators(Validators.required);
      } else {
        locationControl?.clearValidators();
      }
      locationControl?.updateValueAndValidity();
    });
  }

  ngOnInit() {
    this.isLoading = true;
    this.route.paramMap.pipe(
      takeUntil(this.destroy$),
      tap(params => {
        this.tutorId = params.get('tutorId'); 
      }),
      switchMap(() => {
        if (!this.tutorId) {
          this.isLoading = false; 
          this.showErrorAlert('Error', 'ID del tutor no encontrado.');
          this.router.navigateByUrl('/home');
          return of({ tutor: null, currentUser: null });
        }
        return forkJoin({
            tutor: this.userService.getUserProfile(this.tutorId),
            currentUser: this.userService.getCurrentUser()
        });
      })
    ).subscribe({
      next: (data) => {
        if (data.tutor && data.currentUser) {
          this.tutor = data.tutor;
          this.currentUser = data.currentUser;
        } else {
          this.showErrorAlert('Error', 'No se pudo cargar toda la información necesaria (tutor o usuario).');
          this.router.navigateByUrl('/home');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading data for request page:', err); 
        this.isLoading = false;
        this.showErrorAlert('Error', 'Ocurrió un problema al cargar la página de solicitud.');
        this.router.navigateByUrl('/home');
      }
    });
  }

  // Renamed for clarity, used for <ion-datetime presentation="date">
  public formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  // Used to extract HH:mm for Firestore if needed from a full Date object or ISO string
  private formatTimeToHHMM(dateInput: Date | string): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onDateChange(event: any) {
    const isoDateString = event.detail.value; // This is a full ISO string from ion-datetime
    if (isoDateString) {
      // We only need the YYYY-MM-DD part for the 'date' form control
      this.requestForm.patchValue({ date: this.formatDateToYYYYMMDD(new Date(isoDateString)) });
    }
  }

  onTimeChange(event: any) {
    const isoTimeString = event.detail.value; // This is a full ISO string from ion-datetime
    if (isoTimeString) {
      // Store the full ISO string in the form control, ion-datetime presentation="time" will use it
      this.requestForm.patchValue({ time: isoTimeString });
    }
  }

  async submitRequest() {
    if (this.requestForm.invalid || !this.tutor || !this.currentUser) {
      this.showErrorAlert('Formulario Inválido', 'Por favor, completa todos los campos requeridos.');
      return;
    }

    this.isLoading = true;
    const formValue = this.requestForm.value;

    // Extract HH:mm from the ISO string stored in formValue.time
    const timeToSave = formValue.time ? this.formatTimeToHHMM(formValue.time) : this.formatTimeToHHMM(new Date());

    const requestDataObj: Omit<TutoringRequest, 'id' | 'createdAt' | 'status'> & { location?: string } = {
      tutorId: this.tutor.uid,
      studentId: this.currentUser.uid,
      tutorName: this.tutor.nombre,
      studentName: this.currentUser.nombre,
      subject: formValue.subject,
      date: formValue.date,         // This is YYYY-MM-DD
      time: timeToSave,             // This is now HH:mm
      mode: formValue.mode,
      notes: formValue.notes || '', 
    };

    // Conditionally add location
    if (formValue.mode === 'presencial' && formValue.location && formValue.location.trim() !== '') {
      requestDataObj.location = formValue.location;
    }

    console.log('Submitting requestData:', requestDataObj); // For debugging

    try {
      await this.tutorService.requestTutoring(requestDataObj as Omit<TutoringRequest, 'id' | 'createdAt' | 'status'>);
      this.showSuccessAlert('Solicitud Enviada', 'Tu solicitud de tutoría ha sido enviada con éxito.');
      if (this.tutorId) {
        this.router.navigate(['/users-publics', this.tutorId]);
      } else {
        this.router.navigateByUrl('/home');
      }
    } catch (error) {
      console.error('Error submitting tutoring request:', error);
      this.showErrorAlert('Error', 'No se pudo enviar la solicitud. Inténtalo de nuevo.');
    } finally {
      this.isLoading = false;
    }
  }

  async showSuccessAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  async showErrorAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header,
      message,
      buttons: ['OK'],
    });
    await alert.present();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}