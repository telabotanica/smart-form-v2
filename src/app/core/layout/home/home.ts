import {ChangeDetectionStrategy, Component} from '@angular/core';
import {PublicTrailList} from "../../../features/sentier_public/components/public-trail-list/public-trail-list";

@Component({
  selector: 'app-home',
    imports: [
        PublicTrailList
    ],
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {

}
