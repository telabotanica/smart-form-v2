import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { AdminService } from '../../features/admin/services/admin-service';
import { SingleSentierService } from '../../features/sentier/services/single-sentier-service';
import { SharedService } from '../../shared/services/shared.service';
import { Sentier } from '../../features/sentier/models/sentier.model';
import { AdminTrailCard } from '../../features/admin/components/admin-trail-card/admin-trail-card';
import { ErrorComponent } from '../../shared/components/error/error';
import { Loader } from '../../shared/components/loader/loader';
import { SentierForm } from '../../features/sentier/components/sentier-form/sentier-form';
import { ModalConfirmation } from '../../shared/components/modal-confirmation/modal-confirmation';

const PAGE_SIZE = 20;

@Component({
  selector: 'app-admin',
  imports: [AdminTrailCard, ErrorComponent, Loader, SentierForm, ModalConfirmation],
  templateUrl: './admin.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Admin implements OnInit {
  readonly adminService = inject(AdminService);
  readonly singleSentierService = inject(SingleSentierService);
  readonly sharedService = inject(SharedService);

  // --- Filtres ---
  readonly filterName = signal('');
  readonly filterAuthor = signal('');
  readonly filterStatus = signal('');
  readonly showDeleted = signal(false);

  // --- Pagination ---
  readonly currentPage = signal(1);
  readonly pageSize = PAGE_SIZE;

  // --- Modals ---
  showEditModal = false;
  showDeleteModal = false;
  showRejectModal = false;
  showUnpublishModal = false;
  showReactivateModal = false;
  selectedSentier: Sentier | null = null;

  // --- Computed ---
  readonly pendingSentiers = computed(() =>
    this.adminService.sentiers().filter(
      (s) => s.status === 'En attente' && !s.date_suppression
    )
  );

  readonly filteredSentiers = computed(() => {
    const name = this.filterName().toLowerCase().trim();
    const author = this.filterAuthor().toLowerCase().trim();
    const status = this.filterStatus();
    const showDeleted = this.showDeleted();

    return this.adminService.sentiers().filter((s) => {
      // Masquer les supprimés sauf si toggle activé ou filtre "supprimé" explicite
      if (!showDeleted && status !== 'supprimé' && !!s.date_suppression) { return false; }

      const matchName = !name || s.display_name?.toLowerCase().includes(name);
      const matchAuthor =
        !author ||
        s.author?.toLowerCase().includes(author) ||
        s.author_email?.toLowerCase().includes(author);
      const matchStatus =
        !status ||
        (status === 'supprimé' ? !!s.date_suppression : s.status === status) ||
        (status === 'Brouillon' && !s.status && !s.date_suppression);

      return matchName && matchAuthor && matchStatus;
    });
  });

  readonly totalPages = computed(() =>
    Math.max(1, Math.ceil(this.filteredSentiers().length / this.pageSize))
  );

  readonly pagedSentiers = computed(() => {
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return this.filteredSentiers().slice(start, start + this.pageSize);
  });

  readonly pageNumbers = computed(() => {
    const total = this.totalPages();
    const current = this.currentPage();
    // Affiche au max 5 pages autour de la page courante
    const delta = 2;
    const start = Math.max(1, current - delta);
    const end = Math.min(total, current + delta);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  });

  ngOnInit(): void {
    this.sharedService.blurBackground.set(false);
    this.adminService.fetchSentiers();
  }

  onFilterName(event: Event): void {
    this.filterName.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onFilterAuthor(event: Event): void {
    this.filterAuthor.set((event.target as HTMLInputElement).value);
    this.currentPage.set(1);
  }

  onFilterStatus(event: Event): void {
    this.filterStatus.set((event.target as HTMLSelectElement).value);
    this.currentPage.set(1);
  }

  toggleShowDeleted(): void {
    this.showDeleted.update((v) => !v);
    this.currentPage.set(1);
  }

  resetFilters(): void {
    this.filterName.set('');
    this.filterAuthor.set('');
    this.filterStatus.set('');
    this.showDeleted.set(false);
    this.currentPage.set(1);
  }

  goToPage(page: number): void {
    const total = this.totalPages();
    if (page < 1 || page > total) { return; }
    this.currentPage.set(page);
  }

  // --- Modals edit ---
  openEditModal(sentier: Sentier): void {
    this.selectedSentier = sentier;
    this.showEditModal = true;
    this.sharedService.blurBackground.set(true);
  }

  closeEditModal(): void {
    this.selectedSentier = null;
    this.showEditModal = false;
    this.sharedService.blurBackground.set(false);
    this.adminService.fetchSentiers();
  }

  // --- Modals delete ---
  openDeleteModal(sentier: Sentier): void {
    this.selectedSentier = sentier;
    this.showDeleteModal = true;
    this.sharedService.blurBackground.set(true);
  }

  closeDeleteModal(): void {
    this.selectedSentier = null;
    this.showDeleteModal = false;
    this.sharedService.blurBackground.set(false);
  }

  async confirmDelete(): Promise<void> {
    if (!this.selectedSentier) { return; }
    await this.singleSentierService.deleteSentier(this.selectedSentier);
    this.closeDeleteModal();
    if (!this.singleSentierService.error()) {
      this.adminService.fetchSentiers();
    }
  }

  // --- Modals reject ---
  openRejectModal(sentier: Sentier): void {
    this.selectedSentier = sentier;
    this.showRejectModal = true;
    this.sharedService.blurBackground.set(true);
  }

  closeRejectModal(): void {
    this.selectedSentier = null;
    this.showRejectModal = false;
    this.sharedService.blurBackground.set(false);
  }

  async confirmReject(): Promise<void> {
    if (!this.selectedSentier) { return; }
    const success = await this.adminService.rejectSentier(this.selectedSentier);
    this.closeRejectModal();
    if (success) { this.adminService.fetchSentiers(); }
  }

  // --- Modals unpublish ---
  openUnpublishModal(sentier: Sentier): void {
    this.selectedSentier = sentier;
    this.showUnpublishModal = true;
    this.sharedService.blurBackground.set(true);
  }

  closeUnpublishModal(): void {
    this.selectedSentier = null;
    this.showUnpublishModal = false;
    this.sharedService.blurBackground.set(false);
  }

  async confirmUnpublish(): Promise<void> {
    if (!this.selectedSentier) { return; }
    const success = await this.adminService.unpublishSentier(this.selectedSentier);
    this.closeUnpublishModal();
    if (success) { this.adminService.fetchSentiers(); }
  }

  // --- Modals reactivate ---
  openReactivateModal(sentier: Sentier): void {
    this.selectedSentier = sentier;
    this.showReactivateModal = true;
    this.sharedService.blurBackground.set(true);
  }

  closeReactivateModal(): void {
    this.selectedSentier = null;
    this.showReactivateModal = false;
    this.sharedService.blurBackground.set(false);
  }

  async confirmReactivate(): Promise<void> {
    if (!this.selectedSentier) { return; }
    const success = await this.adminService.reactivateSentier(this.selectedSentier);
    this.closeReactivateModal();
    if (success) { this.adminService.fetchSentiers(); }
  }
}
