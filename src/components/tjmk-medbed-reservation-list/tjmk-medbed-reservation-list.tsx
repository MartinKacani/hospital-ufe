import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { ReservationsApi, Reservation, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-medbed-reservation-list',
  styleUrl: 'tjmk-medbed-reservation-list.css',
  shadow: true,
})
export class TjmkMedbedReservationList {
  @Event({ eventName: 'entry-clicked' }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() departmentId: string;
  @State() errorMessage: string;
  @State() statusFilter: string = 'all';

  private reservations: Reservation[] = [];

  private async getReservationsAsync(): Promise<Reservation[]> {
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new ReservationsApi(configuration);
      const response = await api.getReservationsRaw({ departmentId: this.departmentId });
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        this.errorMessage = `Nepodarilo sa načítať objednávky: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať objednávky: ${err.message || 'neznáma chyba'}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.reservations = await this.getReservationsAsync();
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'pending': return 'Čaká';
      case 'confirmed': return 'Potvrdená';
      case 'cancelled': return 'Zrušená';
      default: return status;
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'pending': return 'schedule';
      case 'confirmed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'help';
    }
  }

  private filteredReservations(): Reservation[] {
    if (this.statusFilter === 'all') return this.reservations;
    return this.reservations.filter(r => r.status === this.statusFilter);
  }

  render() {
    if (this.errorMessage) {
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
        </Host>
      );
    }

    const filtered = this.filteredReservations();

    return (
      <Host>
        <div class="filter-bar">
          <md-chip-set>
            <md-filter-chip
              label="Všetky"
              selected={this.statusFilter === 'all'}
              onclick={() => { this.statusFilter = 'all'; }}
            />
            <md-filter-chip
              label="Čakajúce"
              selected={this.statusFilter === 'pending'}
              onclick={() => { this.statusFilter = 'pending'; }}
            />
            <md-filter-chip
              label="Potvrdené"
              selected={this.statusFilter === 'confirmed'}
              onclick={() => { this.statusFilter = 'confirmed'; }}
            />
            <md-filter-chip
              label="Zrušené"
              selected={this.statusFilter === 'cancelled'}
              onclick={() => { this.statusFilter = 'cancelled'; }}
            />
          </md-chip-set>
        </div>

        {filtered.length === 0 ? (
          <div class="empty-state">
            <md-icon class="empty-icon">event_note</md-icon>
            <p>Žiadne objednávky</p>
          </div>
        ) : (
          <md-list>
            {filtered.map(reservation => (
              <md-list-item
                class={`reservation-item status-${reservation.status}`}
                onClick={() => this.entryClicked.emit(reservation.id)}
              >
                <div slot="headline">{reservation.patientName}</div>
                <div slot="supporting-text">
                  {reservation.reason} · {reservation.from.toLocaleDateString('sk')} – {reservation.to.toLocaleDateString('sk')}
                  {reservation.roomOrAmbulance && ` · ${reservation.roomOrAmbulance}`}
                </div>
                <md-icon slot="start">{this.getStatusIcon(reservation.status)}</md-icon>
                <div slot="end">
                  <span class={`status-badge status-${reservation.status}`}>
                    {this.getStatusLabel(reservation.status)}
                  </span>
                </div>
              </md-list-item>
            ))}
          </md-list>
        )}

        <md-filled-icon-button
          class="add-button"
          onclick={() => this.entryClicked.emit('@new')}
        >
          <md-icon>add</md-icon>
        </md-filled-icon-button>
      </Host>
    );
  }
}
