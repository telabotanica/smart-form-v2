import {ChangeDetectionStrategy, Component} from '@angular/core';
import {PublicTrailList} from "../public-trail-list/public-trail-list";

@Component({
  selector: 'app-home',
    imports: [
        PublicTrailList
    ],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Home {

}
