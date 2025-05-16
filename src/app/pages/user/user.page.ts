import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { FormsModule } from '@angular/forms'; 
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import { IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonInput} from '@ionic/angular/standalone'; 

import { UserService } from '../../services/user-info.service';
import { UserProfile } from '../../services/user-profile.interface';

@Component({
  selector: 'app-usuario-propio',
  templateUrl: 'user.page.html',
  styleUrls: ['user.page.scss'],
  standalone: true, 
  imports: [ CommonModule, FormsModule, IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, IonContent, IonList, IonItem, IonLabel, IonInput ],
})
export class UsuarioPropioPage implements OnInit {
  private userService = inject(UserService);
  private alertController = inject(AlertController);
  private router = inject(Router); 

  user: UserProfile | null = null;

  materiasQueDominoString: string = '';
  materiasQueNecesitoString: string = '';
  disponibilidadString: string = '';


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
        } else {
          this.showAlert('Error', 'No se pudo cargar el perfil del usuario.');
        }
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.showAlert('Error', 'Ocurrió un problema al cargar el perfil.');
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
      console.error('Error updating profile:', error);
      this.showAlert('Error', 'Hubo un problema al actualizar el perfil.');
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
}