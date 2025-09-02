import {ChangeDetectionStrategy, Component, effect, inject, OnInit} from '@angular/core';
import {Router, RouterLink} from '@angular/router';
import {UserService} from '../../../../core/auth/services/user.service';
import {MesSentiersService} from '../../services/mes-sentiers-service';
import {ErrorComponent} from '../../../../shared/components/error/error';
import {User} from '../../../../core/auth/user.model';

@Component({
  selector: 'app-mes-sentiers',
  imports: [
    ErrorComponent,
    RouterLink
  ],
  templateUrl: './mes-sentiers.html',
  styleUrl: './mes-sentiers.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MesSentiers implements OnInit{
  private userService = inject(UserService);
  mesSentiersService = inject(MesSentiersService);
  private router = inject(Router);

  user: User | null = null;

  constructor() {
    this.user = this.mesSentiersService.userMe();

    effect(() => {
      if (!this.userService.isLoggedIn()) {
        this.router.navigate(['/']);
      }
    });

    effect(() => {
      this.user = this.mesSentiersService.userMe();
    });
  }

  ngOnInit(): void {
    this.mesSentiersService.fetchMe();
  }
}
