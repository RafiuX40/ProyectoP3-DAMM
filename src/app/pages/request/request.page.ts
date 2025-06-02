import { Component, OnInit, inject, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonContent, IonButtons, IonBackButton, IonList, IonItem, IonLabel, IonInput, IonTextarea, IonSelect, IonSelectOption, IonButton, IonDatetime, IonDatetimeButton, IonModal } from '@ionic/angular/standalone';
import { Subject, forkJoin, of } from 'rxjs';
import { switchMap, takeUntil, tap } from 'rxjs/operators';

import { TutorService } from '../../services/tutor.service'; 
import { UserService } from '../../services/user-info.service'; 
import { UserProfile } from '../../services/user-profile.interface'; 
import { TutoringRequest } from '../../services/tutoring-request.interface'; 

@Component({
  selector: 'app-request',
  templateUrl: './request.page.html',
  styleUrls: ['./request.page.scss'], 
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
      date: [this.formatDateToYYYYMMDD(now), Validators.required], 
      time: [now.toISOString(), Validators.required], 
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

  public formatDateToYYYYMMDD(date: Date): string {
    return date.toISOString().split('T')[0];
  }
  
  private formatTimeToHHMM(dateInput: Date | string): string {
    const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  onDateChange(event: any) {
    const isoDateString = event.detail.value; 
    if (isoDateString) {
      this.requestForm.patchValue({ date: this.formatDateToYYYYMMDD(new Date(isoDateString)) });
    }
  }

  onTimeChange(event: any) {
    const isoTimeString = event.detail.value; 
    if (isoTimeString) {
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

    const timeToSave = formValue.time ? this.formatTimeToHHMM(formValue.time) : this.formatTimeToHHMM(new Date());

    const requestDataObj: Omit<TutoringRequest, 'id' | 'createdAt' | 'status'> & { location?: string } = {
      tutorId: this.tutor.uid,
      studentId: this.currentUser.uid,
      tutorName: this.tutor.nombre,
      studentName: this.currentUser.nombre,
      subject: formValue.subject,
      date: formValue.date,         
      time: timeToSave,             
      mode: formValue.mode,
      notes: formValue.notes || '', 
    };

    if (formValue.mode === 'presencial' && formValue.location && formValue.location.trim() !== '') {
      requestDataObj.location = formValue.location;
    }

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