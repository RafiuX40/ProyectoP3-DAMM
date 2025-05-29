import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import {
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent,
  IonList, IonItem, IonLabel, IonInput,
  IonListHeader,
  IonText,
  IonSpinner
} from '@ionic/angular/standalone';

import { UserService } from '../../services/user-info.service';
import { UserProfile } from '../../services/user-profile.interface';
import { TutorService } from '../../services/tutor.service';
import { TutoringRequest } from '../../services/tutoring-request.interface';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-usuario-propio',
  templateUrl: 'user.page.html',
  styleUrls: ['user.page.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonContent,
    IonList,
    IonItem,
    IonLabel,
    IonInput,
    IonListHeader,
    IonText,
    IonSpinner,
    DatePipe,
    TitleCasePipe
  ],
})
export class UsuarioPropioPage implements OnInit, OnDestroy {
  private userService = inject(UserService);
  private tutorService = inject(TutorService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  user: UserProfile | null = null;

  materiasQueDominoString: string = '';
  materiasQueNecesitoString: string = '';
  disponibilidadString: string = '';
  receivedRequests: TutoringRequest[] = [];
  sentRequests: TutoringRequest[] = [];
  requestsLoading: boolean = true;

  private destroy$ = new Subject<void>();

  ngOnInit() {
    this.loadUserProfile();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserProfile() {
    this.requestsLoading = true; 
    this.userService.getCurrentUser().subscribe({
      next: (userData) => {
        if (userData) {
          this.user = userData;
          this.materiasQueDominoString = this.user.materiasQueDomino?.join(', ') ?? '';
          this.materiasQueNecesitoString = this.user.materiasQueNecesito?.join(', ') ?? '';
          this.disponibilidadString = this.user.disponibilidad?.join(', ') ?? '';
          this.loadTutoringRequests();
        } else {
          this.showAlert('Error', 'No se pudo cargar el perfil del usuario.');
          this.user = null;
          this.requestsLoading = false; 
          this.receivedRequests = [];   
          this.sentRequests = [];       
        }
      },
      error: (err) => {
        this.showAlert('Error', 'Ocurrió un problema al cargar el perfil.');
        this.user = null;
        this.requestsLoading = false; 
        this.receivedRequests = [];   
        this.sentRequests = [];      
      }
    });
  }

  loadTutoringRequests() {
    if (!this.user || !this.user.uid) {
      this.requestsLoading = false;
      this.receivedRequests = [];
      this.sentRequests = [];
      return;
    }

    this.requestsLoading = true; 
    let receivedStreamProcessed = false;
    let sentStreamProcessed = false;

    const checkAndFinalizeLoading = () => {
      if (receivedStreamProcessed && sentStreamProcessed) {
        this.requestsLoading = false;
      }
    };

    this.receivedRequests = [];
    this.sentRequests = [];
    this.tutorService.getRequestsAsTutor(this.user.uid).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: requests => {
        this.receivedRequests = requests;
        receivedStreamProcessed = true;
        checkAndFinalizeLoading();
      },
      error: err => {
        this.showAlert('Error', 'No se pudieron cargar las solicitudes recibidas.');
        this.receivedRequests = [];
        receivedStreamProcessed = true; 
        checkAndFinalizeLoading();
      },
      complete: () => { 
      }
    });

    this.tutorService.getRequestsAsStudent(this.user.uid).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: requests => {
        this.sentRequests = requests;
        sentStreamProcessed = true;
        checkAndFinalizeLoading();
      },
      error: err => {
        this.showAlert('Error', 'No se pudieron cargar las solicitudes enviadas.');
        this.sentRequests = [];
        sentStreamProcessed = true; 
        checkAndFinalizeLoading();
      },
      complete: () => {
      }
    });
  }

  private parseCommaSeparatedString(value: string | undefined | null): string[] {
    if (!value || typeof value !== 'string') {
      return [];
    }
    return value.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  async updateProfile() {
    if (!this.user || !this.user.uid) {
      this.showAlert('Error', 'Datos de usuario no cargados. No se puede actualizar.');
      return;
    }

    const dataToUpdate: Partial<UserProfile> = {
      nombre: this.user.nombre,
      grado: this.user.grado,
      materiasQueDomino: this.parseCommaSeparatedString(this.materiasQueDominoString),
      materiasQueNecesito: this.parseCommaSeparatedString(this.materiasQueNecesitoString),
      disponibilidad: this.parseCommaSeparatedString(this.disponibilidadString),
    };

    try {
      await this.userService.updateUserProfile(this.user.uid, dataToUpdate);
      this.showAlert('Éxito', 'Perfil actualizado con éxito.');
    } catch (error) {
      this.showAlert('Error', 'Hubo un problema al actualizar el perfil.');
    }
  }

  async acceptRequest(requestId: string) {
    try {
      await this.tutorService.updateRequestStatus(requestId, 'aceptada');
      this.showAlert('Éxito', 'Solicitud aceptada.');
    } catch (error) {
      console.error('Error accepting request:', error);
      this.showAlert('Error', 'No se pudo aceptar la solicitud.');
    }
  }

  async denyRequest(requestId: string) {
    try {
      await this.tutorService.updateRequestStatus(requestId, 'rechazada');
      this.showAlert('Éxito', 'Solicitud rechazada.');
    } catch (error) {
      console.error('Error denying request:', error);
      this.showAlert('Error', 'No se pudo rechazar la solicitud.');
    }
  }

  async cancelOwnRequest(requestId: string) {
    try {
      await this.tutorService.updateRequestStatus(requestId, 'cancelada');
      this.showAlert('Éxito', 'Solicitud cancelada.');
    } catch (error) {
      console.error('Error cancelling request:', error);
      this.showAlert('Error', 'No se pudo cancelar la solicitud.');
    }
  }

  getStatusColor(status: TutoringRequest['status']): string {
    switch (status) {
      case 'aceptada': return 'success';
      case 'rechazada':
      case 'cancelada': return 'danger';
      case 'pendiente': return 'warning';
      default: return 'medium';
    }
  }

  async showAlert(header: string, message: string) {
    const alert = await this.alertController.create({
      header: header,
      message: message,
      buttons: ['OK'],
    });
    await alert.present();
  }
  goHome() {
    this.router.navigateByUrl('/home');
  }
}