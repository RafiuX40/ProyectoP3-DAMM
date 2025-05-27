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
export class UsuarioPropioPage implements OnInit {
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

  loadUserProfile() {
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
          this.requestsLoading = false;
        }
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.showAlert('Error', 'Ocurrió un problema al cargar el perfil.');
        this.requestsLoading = false;
      }
    });
  }
  loadTutoringRequests() {
    if (!this.user || !this.user.uid) {
      this.requestsLoading = false;
      return;
    }
    this.requestsLoading = true;

    this.tutorService.getRequestsAsTutor(this.user.uid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(requests => {
      this.receivedRequests = requests;
      this.checkIfAllRequestsLoaded();
    });

    this.tutorService.getRequestsAsStudent(this.user.uid).pipe(
      takeUntil(this.destroy$)
    ).subscribe(requests => {
      this.sentRequests = requests;
      this.checkIfAllRequestsLoaded();
    });
  }
  
  private receivedLoaded = false;
  private sentLoaded = false;
  checkIfAllRequestsLoaded() {
      if (this.receivedRequests) this.receivedLoaded = true;
      if (this.sentRequests) this.sentLoaded = true;
      if (this.receivedLoaded && this.sentLoaded) {
          this.requestsLoading = false;
      }
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
      console.error('Error updating profile:', error);
      this.showAlert('Error', 'Hubo un problema al actualizar el perfil.');
    }
  }

  async acceptRequest(requestId: string) {
    try {
      await this.tutorService.updateRequestStatus(requestId, 'aceptada');
      this.showAlert('Éxito', 'Solicitud aceptada.');
    } catch (error) {
      this.showAlert('Error', 'No se pudo aceptar la solicitud.');
    }
  }

  async denyRequest(requestId: string) {
    try {
      await this.tutorService.updateRequestStatus(requestId, 'rechazada');
      this.showAlert('Éxito', 'Solicitud rechazada.');
    } catch (error) {
      this.showAlert('Error', 'No se pudo rechazar la solicitud.');
    }
  }

  async cancelOwnRequest(requestId: string) {
    try {
      await this.tutorService.updateRequestStatus(requestId, 'cancelada');
      this.showAlert('Éxito', 'Solicitud cancelada.');
    } catch (error) {
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