import {ChangeDetectionStrategy, Component, input} from '@angular/core';

@Component({
  selector: 'app-error',
  imports: [],
  templateUrl: './error.html',
  styleUrl: './error.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ErrorComponent {
  readonly errorMessage = input<string>("");
}
