declare module "react-select-country-list" {
  type CountryListOption = {
    value: string;
    label: string;
  };

  type CountryListApi = {
    getData: () => CountryListOption[];
    getLabel: (value: string) => string;
    getValue: (label: string) => string;
  };

  export default function countryList(): CountryListApi;
}
