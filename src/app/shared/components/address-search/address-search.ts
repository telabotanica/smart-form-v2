import {
  ChangeDetectionStrategy,
  Component,
  inject,
  output,
  signal
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {NominatimResult, NominatimService} from './nominatim.service';

@Component({
  selector: 'app-address-search',
  imports: [FormsModule],
  templateUrl: './address-search.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddressSearchComponent {
  readonly selected = output<NominatimResult>();

  readonly nominatim = inject(NominatimService);
  readonly query = signal('');
  readonly showResults = signal(false);
  readonly mobileModalOpen = signal(false);

  onQueryChange(value: string): void {
    this.query.set(value);
    this.showResults.set(true);
    this.nominatim.search(value);
  }

  onSelect(result: NominatimResult): void {
    this.query.set(result.display_name);
    this.showResults.set(false);
    this.mobileModalOpen.set(false);
    this.nominatim.clear();
    this.selected.emit(result);
  }

  onClear(): void {
    this.query.set('');
    this.showResults.set(false);
    this.nominatim.clear();
  }

  openMobileModal(): void {
    this.mobileModalOpen.set(true);
  }

  closeMobileModal(): void {
    this.mobileModalOpen.set(false);
    this.onClear();
  }
}
