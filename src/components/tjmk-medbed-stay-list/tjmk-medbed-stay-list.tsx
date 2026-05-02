import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { StaysApi, HospitalizationStay, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-medbed-stay-list',
  styleUrl: 'tjmk-medbed-stay-list.css',
  shadow: true,
})
export class TjmkMedbedStayList {
  @Event({ eventName: 'entry-clicked' }) entryClicked: EventEmitter<string>;
  @Prop() apiBase: string;
  @Prop() departmentId: string;
  @State() errorMessage: string;
  @State() viewMode: 'list' | 'grid' = 'grid';
  @State() statusFilter: string = 'active_planned';

  private stays: HospitalizationStay[] = [];

  private async getStaysAsync(): Promise<HospitalizationStay[]> {
    try {
      const configuration = new Configuration({ basePath: this.apiBase });
      const api = new StaysApi(configuration);
      const response = await api.getStaysRaw({ departmentId: this.departmentId });
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        this.errorMessage = `Nepodarilo sa načítať hospitalizácie: ${response.raw.statusText}`;
      }
    } catch (err: any) {
      this.errorMessage = `Nepodarilo sa načítať hospitalizácie: ${err.message || 'neznáma chyba'}`;
    }
    return [];
  }

  async componentWillLoad() {
    this.stays = await this.getStaysAsync();
  }

  private getStatusLabel(status: string): string {
    switch (status) {
      case 'planned': return 'Plánovaná';
      case 'active': return 'Aktívna';
      case 'completed': return 'Ukončená';
      case 'cancelled': return 'Zrušená';
      default: return status;
    }
  }

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'planned': return 'schedule';
      case 'active': return 'local_hospital';
      case 'completed': return 'check_circle';
      case 'cancelled': return 'cancel';
      default: return 'bed';
    }
  }

  private filteredStays(): HospitalizationStay[] {
    switch (this.statusFilter) {
      case 'active_planned':
        return this.stays.filter(s => s.status === 'active' || s.status === 'planned');
      case 'completed':
        return this.stays.filter(s => s.status === 'completed' || s.status === 'cancelled');
      default:
        return this.stays;
    }
  }

  private groupByRoom(stays: HospitalizationStay[]): Map<string, HospitalizationStay[]> {
    const rooms = new Map<string, HospitalizationStay[]>();
    for (const stay of stays) {
      const room = stay.roomNumber || 'Nepridelená';
      if (!rooms.has(room)) rooms.set(room, []);
      rooms.get(room).push(stay);
    }
    return rooms;
  }

  private renderBedGrid() {
    const filtered = this.filteredStays();
    const rooms = this.groupByRoom(filtered);

    if (rooms.size === 0) {
      return (
        <div class="empty-state">
          <md-icon class="empty-icon">bed</md-icon>
          <p>Žiadne hospitalizácie</p>
        </div>
      );
    }

    return (
      <div class="bed-grid">
        {Array.from(rooms.entries()).map(([room, roomStays]) => (
          <div class="room-card">
            <div class="room-header">
              <md-icon>meeting_room</md-icon>
              <span>Izba {room}</span>
              <span class="room-count">{roomStays.length} {roomStays.length === 1 ? 'pacient' : 'pacienti'}</span>
            </div>
            <div class="bed-list">
              {roomStays.map(stay => (
                <div
                  class={`bed-item status-${stay.status}`}
                  onClick={() => this.entryClicked.emit(stay.id)}
                >
                  <div class="bed-number">
                    <md-icon>bed</md-icon>
                    <span>{stay.bedNumber}</span>
                  </div>
                  <div class="bed-info">
                    <div class="bed-patient">{stay.patientName}</div>
                    <div class="bed-dates">
                      {stay.from.toLocaleDateString('sk')} – {stay.to.toLocaleDateString('sk')}
                    </div>
                  </div>
                  <span class={`status-dot status-${stay.status}`} title={this.getStatusLabel(stay.status)} />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  private renderList() {
    const filtered = this.filteredStays();
    if (filtered.length === 0) {
      return (
        <div class="empty-state">
          <md-icon class="empty-icon">bed</md-icon>
          <p>Žiadne hospitalizácie</p>
        </div>
      );
    }
    return (
      <md-list>
        {filtered.map(stay => (
          <md-list-item
            class={`stay-item status-${stay.status}`}
            onClick={() => this.entryClicked.emit(stay.id)}
          >
            <div slot="headline">{stay.patientName}</div>
            <div slot="supporting-text">
              Izba {stay.roomNumber} · Lôžko {stay.bedNumber} · {stay.from.toLocaleDateString('sk')} – {stay.to.toLocaleDateString('sk')}
            </div>
            <md-icon slot="start">{this.getStatusIcon(stay.status)}</md-icon>
            <span slot="end" class={`status-badge status-${stay.status}`}>
              {this.getStatusLabel(stay.status)}
            </span>
          </md-list-item>
        ))}
      </md-list>
    );
  }

  render() {
    if (this.errorMessage) {
      return (
        <Host>
          <div class="error">{this.errorMessage}</div>
        </Host>
      );
    }

    return (
      <Host>
        <div class="toolbar">
          <md-chip-set>
            <md-filter-chip
              label="Aktívne / Plánované"
              selected={this.statusFilter === 'active_planned'}
              onclick={() => { this.statusFilter = 'active_planned'; }}
            />
            <md-filter-chip
              label="Ukončené / Zrušené"
              selected={this.statusFilter === 'completed'}
              onclick={() => { this.statusFilter = 'completed'; }}
            />
            <md-filter-chip
              label="Všetky"
              selected={this.statusFilter === 'all'}
              onclick={() => { this.statusFilter = 'all'; }}
            />
          </md-chip-set>
          <div class="view-toggle">
            <md-icon-button
              onclick={() => { this.viewMode = 'grid'; }}
              title="Zobrazenie izieb"
            >
              <md-icon>{this.viewMode === 'grid' ? 'grid_view' : 'grid_view'}</md-icon>
            </md-icon-button>
            <md-icon-button
              onclick={() => { this.viewMode = 'list'; }}
              title="Zoznam"
            >
              <md-icon>list</md-icon>
            </md-icon-button>
          </div>
        </div>

        {this.viewMode === 'grid' ? this.renderBedGrid() : this.renderList()}

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
