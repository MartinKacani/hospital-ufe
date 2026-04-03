import { Component, Event, EventEmitter, Host, Prop, State, h } from '@stencil/core';
import { HospitalWaitingListApi, WaitingListEntry, Configuration } from '../../api/hospital-wl';

@Component({
  tag: 'tjmk-hospital-wl-list',
  styleUrl: 'tjmk-hospital-wl-list.css',
  shadow: true,
})
export class TjmkHospitalWlList {
  @Event({ eventName: "entry-clicked" }) entryClicked: EventEmitter<string>
  @Prop() apiBase: string;
  @Prop() hospitalId: string;
  @State() errorMessage: string;

   waitingPatients: WaitingListEntry[];

  private async getWaitingPatientsAsync(): Promise<WaitingListEntry[]> {
    // be prepared for connectivitiy issues
    try {
      const configuration = new Configuration({
        basePath: this.apiBase,
      });

      const waitingListApi = new HospitalWaitingListApi(configuration);
      const response = await waitingListApi.getWaitingListEntriesRaw({hospitalId: this.hospitalId})
      if (response.raw.status < 299) {
        return await response.value();
      } else {
        this.errorMessage = `Cannot retrieve list of waiting patients: ${response.raw.statusText}`
      }
    } catch (err: any) {
      this.errorMessage = `Cannot retrieve list of waiting patients: ${err.message || "unknown"}`
    }
    return [];
  }

  async componentWillLoad() {
    this.waitingPatients = await this.getWaitingPatientsAsync();
  }

  render() {
    return (
      <Host>
        {this.errorMessage
          ? <div class="error">{this.errorMessage}</div>
          :
        <md-list>
          {this.waitingPatients.map(patient =>
            <md-list-item onClick={ () => this.entryClicked.emit(patient.id)} >
              <div slot="headline">{patient.name}</div>
              <div slot="supporting-text">{"Predpokladaný vstup: " + patient.estimatedStart?.toLocaleString()}</div>
              <md-icon slot="start">person</md-icon>
            </md-list-item>
          )}
        </md-list>
        }
      </Host>
    );
  }
}
