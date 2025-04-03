import { Component, OnInit, ViewChild } from '@angular/core';
import { NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule]
})

export class LoginPage implements OnInit {
  @ViewChild('loginForm') loginForm!: NgForm;


  email: string = '';
  password: string = '';
 
  constructor(private authService: AuthService, private alertController: AlertController, private router: Router) {}


  ngOnInit() {}


  async onSubmit() {
    try {
      await this.authService.login(this.loginForm.value.email, this.loginForm.value.password);
      const alert = await this.alertController.create({
        header: 'Éxito',
        message: 'Ha conseguido iniciar sesión',
        buttons: ['Ok'],
      });
      await alert.present();
      this.router.navigate(['/home']);
    } catch (error) {
      const alert = await this.alertController.create({
        header: 'Error',
        message: 'An error occurred during login.',
        buttons: ['OK'],
      });
      await alert.present();
    }

  }

/*
validateEmail(email: string): boolean {
  const emailPattern = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailPattern.test(email);
}
*/

gosign(){
this.router.navigateByUrl('sign-up')
}


goreset(){
this.router.navigateByUrl('reset-password')
}


}
