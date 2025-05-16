import { Component, OnInit, ViewChild, inject } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user-info.service';
import { UserProfile } from '../../services/user-profile.interface'; 

@Component({
  selector: 'app-sign-up',
  templateUrl: './sign-up.page.html',
  styleUrls: ['./sign-up.page.scss'],
  standalone: true,
  imports: [ IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule ],
})
export class SignUpPage implements OnInit {
  @ViewChild('signUpForm') signUpForm!: NgForm; 

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
      Object.values(this.signUpForm.controls).forEach(control => {
        control.markAsTouched();
      });
      return;
    }

    const formValue = this.signUpForm.value;

    try {
      const userCredential = await this.authService.register(formValue.email, formValue.password);

      if (userCredential && userCredential.user) {
        const userId = userCredential.user.uid;

        const profileDataForCreation: Omit<UserProfile, 'uid'> = {
          email: formValue.email,
          nombre: formValue.nombre,
          grado: formValue.grado,
          materiasQueDomino: this.parseCommaSeparatedString(formValue.materiasQueDomino),
          materiasQueNecesito: this.parseCommaSeparatedString(formValue.materiasQueNecesito),
          disponibilidad: this.parseCommaSeparatedString(formValue.disponibilidad),
          averageRating: 0, 
          ratingCount: 0,
        };

        await this.userService.createUserProfile(userId, profileDataForCreation);

        const alert = await this.alertController.create({
          header: 'Éxito',
          message: '¡Cuenta creada y perfil guardado! Ahora puedes iniciar sesión.',
          buttons: ['OK'],
        });
        await alert.present();
        this.signUpForm.reset(); 
        this.router.navigate(['/login']);
      } else {
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
