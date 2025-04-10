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
