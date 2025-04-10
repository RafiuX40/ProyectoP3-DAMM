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

 /*
 validateEmail(email: string): boolean {
   const emailPattern = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9-]+\.[a-zA-Z]{2,4}$/;
   return emailPattern.test(email);
 }
*/

 gologin() {
   this.router.navigateByUrl("login");
 }
}
