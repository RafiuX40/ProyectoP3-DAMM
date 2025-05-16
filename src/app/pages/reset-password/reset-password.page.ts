import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.page.html',
  styleUrls: ['./reset-password.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})
export class ResetPasswordPage implements OnInit {
  @ViewChild('loginForm') loginForm!: NgForm;
  email: string = '';
 
  constructor(private authService: AuthService, private alertController: AlertController, private router: Router) { }
 
  ngOnInit() {
  }
 
 async onSubmit() {
   try {
     await this.authService.resetPassword(this.loginForm.value.email);
     const alert = await this.alertController.create({
       header: 'Éxito',
       message: 'Se ha enviado el correo para reestablecer contraseña',
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

