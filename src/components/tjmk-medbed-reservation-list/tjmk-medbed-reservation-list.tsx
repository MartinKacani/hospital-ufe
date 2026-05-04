import { Component, Event, EventEmitter, Host, Prop, State, Watch, h } from '@stencil/core';
import { ReservationsApi, Reservation, Department, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-medbed-reservation-list',
  styleUrl: 'tjmk-medbed-reservation-list.css',
  shadow: true,
})
export class TjmkMedbedReservationList {
  @Event({ eventName: 'entry-clicked' }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() departments: Department[] = [];
  @State() errorMessage: string;
  @State() statusFilter: string = 'all';
  @State() private reservations: Reservation[] = [];

  async componentWillLoad() {
    await this.loadAll();
  }

  @Watch('departments')
  async onDepartmentsChanged() {
    await this.loadAll();
  }

  private async loadAll() {
    if (!this.departments?.length) return;
    try {
      const config = new Configuration({ basePath: this.apiBase });
      const api = new ReservationsApi(config);
      const results = await Promise.all(
        this.departments.map(d =>
          api.getReservations({ departmentId: d.id }).catch(() => [] as Reservation[])
        )
      );
      this.reservations = results.flat();
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať objednávky: ${err.message || 'neznáma chyba'}`;
    }
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

  private filtered(): Reservation[] {
    if (this.statusFilter === 'all') return this.reservations;
    return this.reservations.filter(r => r.status === this.statusFilter);
  }

  render() {
    if (this.errorMessage) {
      return <Host><div class="error">{this.errorMessage}</div></Host>;
    }

    const filtered = this.filtered();
    const multiDept = this.departments.length > 1;

    return (
      <Host>
        <div class="filter-bar">
          <md-chip-set>
            <md-filter-chip label="Všetky" selected={this.statusFilter === 'all'} onclick={() => { this.statusFilter = 'all'; }} />
            <md-filter-chip label="Čakajúce" selected={this.statusFilter === 'pending'} onclick={() => { this.statusFilter = 'pending'; }} />
            <md-filter-chip label="Potvrdené" selected={this.statusFilter === 'confirmed'} onclick={() => { this.statusFilter = 'confirmed'; }} />
            <md-filter-chip label="Zrušené" selected={this.statusFilter === 'cancelled'} onclick={() => { this.statusFilter = 'cancelled'; }} />
          </md-chip-set>
        </div>

        {filtered.length === 0 ? (
          <div class="empty-state">
            <md-icon class="empty-icon">event_note</md-icon>
            <p>Žiadne objednávky</p>
          </div>
        ) : (
          <md-list>
            {filtered.map(r => (
              <md-list-item
                class={`reservation-item status-${r.status}`}
                onClick={() => this.entryClicked.emit(`${r.department}/${r.id}`)}
              >
                <div slot="headline">{r.patientName}</div>
                <div slot="supporting-text">
                  {r.reason} · {r.from.toLocaleDateString('sk')} – {r.to.toLocaleDateString('sk')}
                  {r.roomOrAmbulance && ` · ${r.roomOrAmbulance}`}
                  {multiDept && ` · ${r.department}`}
                </div>
                <md-icon slot="start">{this.getStatusIcon(r.status)}</md-icon>
                <div slot="end">
                  <span class={`status-badge status-${r.status}`}>{this.getStatusLabel(r.status)}</span>
                </div>
              </md-list-item>
            ))}
          </md-list>
        )}

        <md-filled-icon-button class="add-button" onclick={() => this.entryClicked.emit('@new')}>
          <md-icon>add</md-icon>
        </md-filled-icon-button>
      </Host>
    );
  }
}
