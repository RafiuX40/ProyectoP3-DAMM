/*
import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';


@Component({
 selector: 'app-sign-up',
 templateUrl: './sign-up.page.html',
 styleUrls: ['./sign-up.page.scss'],
 standalone: true,
 imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class SignUpPage implements OnInit {
  @ViewChild('loginForm') loginForm!: NgForm;
 email: string = '';
 password: string = '';

 constructor(private authService: AuthService, private alertController: AlertController, private router: Router) { }

 ngOnInit() {
 }

async onSubmit() {
  try {
    await this.authService.register(this.loginForm.value.email, this.loginForm.value.password);
    const alert = await this.alertController.create({
      header: 'Éxito',
      message: 'Ahora tienes cuenta :D',
      buttons: ['OK'],
    });
    await alert.present();
    this.router.navigate(['/login']);
  } catch (error) {
    const alert = await this.alertController.create({
      header: 'Error',
      message: 'Ha ocurrido un error :(',
      buttons: ['OK'],
    });
    await alert.present();
  }
 }

 gologin() {
   this.router.navigateByUrl("login");
 }
}
*/
// sign-up.page.ts
import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user-info.service'; // Import UserService
import { UserProfile } from '../../services/user-profile.interface'; // Import UserProfile interface

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    CommonModule,
    FormsModule,
  ],
})
export class SignUpPage implements OnInit {
  @ViewChild('signUpForm') signUpForm!: NgForm; // Renamed from loginForm

  // Using inject for services is a modern approach in Angular
  private authService = inject(AuthService);
  private userService = inject(UserService);
  private alertController = inject(AlertController);
  private router = inject(Router);

  constructor() {}

  ngOnInit() {}

  private parseCommaSeparatedString(value: string | undefined | null): string[] {
    if (!value || typeof value !== 'string') {
      return [];
    }
    return value.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  async onSubmit() {
    if (this.signUpForm.invalid) {
      // Mark all fields as touched to show validation messages
      Object.values(this.signUpForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const formValue = this.signUpForm.value;

    try {
      // 1. Register the user with Firebase Auth
      const userCredential = await this.authService.register(formValue.email, formValue.password);

      if (userCredential && userCredential.user) {
        const userId = userCredential.user.uid;

        // 2. Prepare profile data
        // Omit 'uid' as it's the document key, and type it for what we send to createUserProfile
        const profileDataForCreation: Omit<UserProfile, 'uid'> = {
          email: formValue.email,
          nombre: formValue.nombre,
          grado: formValue.grado,
          materiasQueDomino: this.parseCommaSeparatedString(formValue.materiasQueDomino),
          materiasQueNecesito: this.parseCommaSeparatedString(formValue.materiasQueNecesito),
          disponibilidad: this.parseCommaSeparatedString(formValue.disponibilidad),
          averageRating: 0, // Initialize rating fields
          ratingCount: 0,
        };

        // 3. Create the user profile document in Firestore
        await this.userService.createUserProfile(userId, profileDataForCreation);

        const alert = await this.alertController.create({
          header: 'Éxito',
          message: '¡Cuenta creada y perfil guardado! Ahora puedes iniciar sesión.',
          buttons: ['OK'],
        });
        await alert.present();
        this.signUpForm.reset(); // Reset the form
        this.router.navigate(['/login']);
      } else {
        // This case should ideally not happen if register is successful
        throw new Error('No se pudo obtener la información del usuario después del registro.');
      }
    } catch (error: any) {
      console.error('Error during sign-up or profile creation:', error);
      let errorMessage = 'Ha ocurrido un error durante el registro.';
      if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'Este correo electrónico ya está en uso.';
            break;
          case 'auth/weak-password':
            errorMessage = 'La contraseña es demasiado débil.';
            break;
          // Add other Firebase Auth error codes as needed
          default:
            errorMessage = 'Error al crear la cuenta: ' + (error.message || 'Error desconocido');
        }
      } else if (error.message) {
        errorMessage = error.message;
      }

      const alert = await this.alertController.create({
        header: 'Error',
        message: errorMessage,
        buttons: ['OK'],
      });
      await alert.present();
    }
  }

  gologin() {
    this.router.navigateByUrl('/login');
  }
}
