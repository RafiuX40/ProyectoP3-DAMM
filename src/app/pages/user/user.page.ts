/*
import { Component } from '@angular/core';
import { UserService } from '../../services/user-info.service';
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-usuario-propio',
  templateUrl: 'user.page.html',
  styleUrls: ['user-propio.page.scss'],
})
export class UsuarioPropioPage {

  user: any = {
    name: '',
    email: '',
    grado: '',
    materiasQueDomina: '',
    materiasQueNecesita: '',
    disponibilidad: ''
  };

  constructor(
    private userService: UserService,
    private alertController: AlertController,
    private router: Router
  ) {}

  ngOnInit() {
    this.userService.getCurrentUser().subscribe((userData) => {
      if (userData) {
        this.user = userData;
      } else {
        this.showAlert('Error', 'No se pudo cargar el perfil.');
      }
    });
  }

  async updateProfile() {
    try {
      await this.userService.updateUserProfile(this.user.id, this.user);
      this.showAlert('Éxito', 'Perfil actualizado con éxito.');
    } catch (error) {
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
*/
import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common'; // Import CommonModule
import { FormsModule } from '@angular/forms'; // Import FormsModule for ngModel
import { Router } from '@angular/router';
import { AlertController } from '@ionic/angular';
import {
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
} from '@ionic/angular/standalone'; // Import Standalone Ionic Components

import { UserService } from '../../services/user-info.service';
import { UserProfile } from '../../services/user-profile.interface'; // Import the interface

@Component({
  selector: 'app-usuario-propio',
  templateUrl: 'user.page.html',
  // Make sure this path is correct for your project structure
  styleUrls: ['user.page.scss'],
  standalone: true, // Make the component standalone
  imports: [
    // Add necessary imports for the template
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
  ],
})
export class UsuarioPropioPage implements OnInit {
  // Use inject() for dependency injection
  private userService = inject(UserService);
  private alertController = inject(AlertController);
  private router = inject(Router); // Keep router if needed for future navigation

  // Type the user property strongly and initialize to null
  user: UserProfile | null = null;

  // Add intermediate string properties for array fields bound to inputs
  materiasQueDominoString: string = '';
  materiasQueNecesitoString: string = '';
  disponibilidadString: string = '';

  // No constructor needed for DI with inject()

  ngOnInit() {
    this.loadUserProfile();
  }

  loadUserProfile() {
    // No need to unsubscribe manually if using take(1) or async pipe,
    // but here we subscribe directly to update local state.
    // Angular usually handles component destruction subscriptions.
    this.userService.getCurrentUser().subscribe({
      next: (userData) => {
        if (userData) {
          this.user = userData;
          // Populate string representations for array fields
          this.materiasQueDominoString = this.user.materiasQueDomino?.join(', ') ?? '';
          this.materiasQueNecesitoString = this.user.materiasQueNecesito?.join(', ') ?? '';
          this.disponibilidadString = this.user.disponibilidad?.join(', ') ?? '';
        } else {
          // Handle case where user data couldn't be loaded (e.g., not logged in)
          this.showAlert('Error', 'No se pudo cargar el perfil del usuario.');
          // Optionally redirect to login or show a specific message
          // this.router.navigate(['/login']);
        }
      },
      error: (err) => {
        console.error('Error loading user profile:', err);
        this.showAlert('Error', 'Ocurrió un problema al cargar el perfil.');
      }
    });
  }

  // Helper function to parse comma-separated strings into arrays (like in SignUpPage)
  private parseCommaSeparatedString(value: string | undefined | null): string[] {
    if (!value || typeof value !== 'string') {
      return [];
    }
    return value.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  async updateProfile() {
    // Guard clause: Ensure user data is loaded before trying to update
    if (!this.user || !this.user.uid) {
      this.showAlert('Error', 'Datos de usuario no cargados. No se puede actualizar.');
      return;
    }

    // Prepare the data object with only the fields that can be updated
    // Ensure it matches the structure expected by updateUserProfile (Partial<UserProfile>)
    const dataToUpdate: Partial<UserProfile> = {
      // Use the properties directly from the 'user' object for non-array fields
      // if they are bound directly in the template (check HTML step)
      nombre: this.user.nombre,
      grado: this.user.grado,
      // Parse the string inputs back into arrays before saving
      materiasQueDomino: this.parseCommaSeparatedString(this.materiasQueDominoString),
      materiasQueNecesito: this.parseCommaSeparatedString(this.materiasQueNecesitoString),
      disponibilidad: this.parseCommaSeparatedString(this.disponibilidadString),
      // Do not include fields like email or uid if they shouldn't be updated directly
      // Do not include rating fields here, they are updated via rateTutor
    };

    try {
      // Use the correct uid property from the loaded user profile
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