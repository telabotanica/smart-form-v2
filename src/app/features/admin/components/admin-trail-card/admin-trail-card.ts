import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Sentier } from '../../../../features/sentier/models/sentier.model';

@Component({
  selector: 'app-admin-trail-card',
  imports: [DatePipe, RouterLink],
  templateUrl: './admin-trail-card.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminTrailCard {
  readonly sentier = input.required<Sentier>();

  readonly edit = output<Sentier>();
  readonly delete = output<Sentier>();
  readonly unpublish = output<Sentier>();
  readonly reject = output<Sentier>();
  readonly reactivate = output<Sentier>();

  readonly statusBadgeClass = computed(() => {
    const status = this.sentier().status?.toLowerCase();
    if (status === 'validé') {
      return 'bg-accent-100 text-accent border border-accent-200';
    }
    if (this.sentier().status === 'En attente') {
      return 'bg-primary-100 text-secondary border border-primary-200';
    }
    return 'bg-background-200 text-text-500 border border-background-300';
  });

  readonly statusColor = computed(() => {
    const status = this.sentier().status?.toLowerCase();
    if (status === 'validé') {
      return 'bg-accent';
    }
    if (this.sentier().status === 'En attente') {
      return 'bg-primary';
    }
    if (this.sentier().date_suppression) {
      return 'bg-red-500';
    }
    return 'bg-background-300';
  });

  onEdit(): void {
    this.edit.emit(this.sentier());
  }

  onDelete(): void {
    this.delete.emit(this.sentier());
  }

  onUnpublish(): void {
    this.unpublish.emit(this.sentier());
  }

  onReject(): void {
    this.reject.emit(this.sentier());
  }

  onReactivate(): void {
    this.reactivate.emit(this.sentier());
  }
}
