import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  HostListener,
  inject,
  OnInit,
  signal
} from '@angular/core';
import {AuthApiService} from '../services/auth-api.service';
import {UserService} from '../services/user.service';
import {environment} from '../../../../environments/environment';
import {FormControl, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {CookieService} from 'ngx-cookie-service';
import {CommonModule} from '@angular/common';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {ErrorComponent} from '../../../shared/components/error/error';

type AuthForm = {
  username: FormControl<string>;
  password: FormControl<string>;
}

@Component({
  selector: 'app-auth',
  imports: [ReactiveFormsModule, CommonModule, ErrorComponent],
  templateUrl: './auth.html',
  styleUrl: './auth.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export default class AuthComponent implements OnInit {
  cookieName = environment.cookieName;
  inscriptionUrl = environment.inscriptionUrl
  loginForm: FormGroup<AuthForm>;
  passwordFieldType = 'password';
  passwordFieldIcon = 'visibility_off';

  readonly error = signal<string>('');
  readonly loginPopup = signal(false);

  authApiService = inject(AuthApiService);
  userService = inject(UserService);
  cookieService = inject(CookieService);
  destroyRef = inject(DestroyRef);

  constructor() {
    this.loginForm = new FormGroup<AuthForm>({
      username: new FormControl("", {
        validators: [Validators.required],
        nonNullable: true,
      }),
      password: new FormControl("", {
        validators: [Validators.required],
        nonNullable: true,
      }),
    });
  }

  ngOnInit(): void {
    const cookie = this.cookieService.get(this.cookieName)
    if (cookie){
      this.userService.setLoggedIn(true);
      this.authApiService.identite().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
        next: (data) => {
          const token = data.token ?? '';
          this.userService.setUserData(token);
        },
        error: (err) => {
          console.error(err)
        }
      })
    }
  }

  onSubmit(): void {
    this.error.set('');

    if(this.loginForm.valid){
      const { username, password } = this.loginForm.value;

      this.authApiService.login(username!, password!)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: (data) => {
            const token = data ?? '';
            this.userService.setUserData(token);
            this.userService.addAdminRole(this.userService.user());
            this.error.set('');
            this.loginPopup.set(false);
          },
          error: (err) => {
            console.error(err)
            this.error.set(err.error ?? 'Erreur inconnue');
          }
        });
    } else {
      this.error.set('Veuillez remplir tous les champs');
    }
  }

  logout(): void {
    this.authApiService.logout()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.userService.setUserId("")
          this.userService.setUser(null)
          this.userService.setLoggedIn(false)
        },
        error: (err) => {
          console.error(err)
        }
    })
  }

  togglePasswordVisibility(): void {
    if (this.passwordFieldType === 'password') {
      this.passwordFieldType = 'text';
      this.passwordFieldIcon = 'visibility';
    } else {
      this.passwordFieldType = 'password';
      this.passwordFieldIcon = 'visibility_off';
    }
  }

  openLoginPopup(): void { this.loginPopup.set(true); }
  closeLoginPopup(): void { this.loginPopup.set(false); }

  handleKey(event: KeyboardEvent): void {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault(); // éviter le scroll si c’est Space
      this.closeLoginPopup();
    }
  }

  // Écoute globale pour la touche Escape
  @HostListener('window:keydown', ['$event'])
  onEscape(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeLoginPopup();
    }
  }

}
