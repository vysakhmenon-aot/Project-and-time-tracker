// @flow
import BaseDto from '../abstract/Base.dto';

export default class RFxTypeDto extends BaseDto {
  static constructFromObject(data, obj) {
    if (data) {
      obj = obj || new RFxTypeDto();
      BaseDto.setProperties(data, obj);
    }

    return obj;
  }

  id = '';

  rfxTypeName = '';
}
