import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

@Component({
  selector: 'app-error',
  imports: [],
  templateUrl: './error.html',
  styleUrl: './error.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorComponent {
  @Input() errorMessage = '';
}
