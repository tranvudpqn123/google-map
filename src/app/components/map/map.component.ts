import {Component, OnInit} from '@angular/core';
import * as L from 'leaflet';
import {FormBuilder, FormControl, FormGroup} from "@angular/forms";
import {debounceTime} from "rxjs/operators";
import {merchants as merchantsData} from "./data";

@Component({
    selector: 'app-map',
    templateUrl: './map.component.html',
    styleUrls: ['./map.component.scss']
})
export class MapComponent implements OnInit {

    private markerLayer: L.LayerGroup = L.layerGroup();
    private map: L.Map;
    private centroid: L.LatLngExpression = [21.040973510502976, 105.83468800262507];
    private originalMerchants: any[] = merchantsData;
    merchants: any[] = [];
    focusedMerchant: any = null;

    serviceTypes = [
        {
            id: '842F3818-8D93-49F5-8776-1F070074CA12',
            name: 'Khách Sạn',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_430702081120241.png'
        },
        {
            id: 'F563F22E-C3D7-40AE-ABEE-2CDB6BD1AA88',
            name: 'Khác',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_540810281020241.png'
        },
        {
            id: '44B1259A-A64F-4AB5-A920-7122B08B12D9',
            name: 'Giải trí',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_171810281020241.png'
        },
        {
            id: '69416C9E-EAB5-4874-93F3-757FA9DEAEA3',
            name: 'Thời Trang',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_191910281020241.png'
        },
        {
            id: '3D86AE99-748A-4C98-8CDE-79C45F4C9C77',
            name: 'Đồ Uống',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_511910281020241.png'
        },
        {
            id: '226CE7E7-F18F-4CB9-86F8-97BE5AF2CDA9',
            name: 'Thực Phẩm',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_154809281020241.png'
        },
        {
            id: 'CF08C8F6-E672-47CC-A20E-9EC9DB5EFE66',
            name: 'Du Lịch',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_011810281020241.png'
        },
        {
            id: '899F521A-D6B5-4C0E-98B3-C9EA8A301662',
            name: 'Phụ Kiện',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_230212281020241.png'
        },
        {
            id: '3356AF6F-6CBF-4447-8C5F-DF2755A900AC',
            name: 'Sức Khỏe',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_421810281020241.png'
        },
        {
            id: 'F34468D1-65F2-4DEF-B01E-EDEA967E3EEE',
            name: 'Ẩm Thực',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_082010281020241.png'
        },
        {
            id: '09EE9301-64B8-44C6-BC90-FA24F89A2F3B',
            name: 'Làm Đẹp',
            icon: 'https://cms.cashplus.vn/download/loyalty/1PNG_331910281020241.png'
        }
    ];
    searchForm: FormGroup;

    constructor(private fb: FormBuilder) {
        this.searchForm = this.fb.group({
            keySearch: ['']
        });
    }

    get keySearch(): FormControl {
        return this.searchForm.get('keySearch') as FormControl;
    }

    ngOnInit(): void {
        this.map = L.map('googleMap', {
            center: this.centroid,
            zoom: 13
        });

        const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            minZoom: 10,
            attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        });

        this.originalMerchants = this.originalMerchants.map((item, index) => ({...item, orderNumber: index}));
        this.merchants = this.originalMerchants;

        this.initMap(tiles);

        this.keySearch.valueChanges
            .pipe(debounceTime(500))
            .subscribe(keySearch => {
                this.merchants = this.originalMerchants.filter(item => this.isSubstringIgnoringAccent(keySearch, item.name));
                this.initMap(tiles);

                if (this.merchants.length > 0) {
                    const bounds = L.latLngBounds(
                        this.merchants.map(merchant => [merchant.latitude, merchant.longtitude])
                    );
                    this.map.fitBounds(bounds, { padding: [50, 50] }); // Optional: Add padding for better visibility
                }
            });

    }

    onSelectServiceType(serviceType: any): void {
        serviceType.selected = !serviceType.selected;
        const nodes = document.querySelectorAll('.marker-icon[data-service-id="' + serviceType.id.toLowerCase() + '"]');

        if (serviceType.selected) {
            nodes.forEach(node => {
                const element = node as HTMLElement; // Cast to HTMLElement if needed
                element.style.backgroundColor = 'red';
                element.style.color = 'white';
            });
        } else {
            nodes.forEach(node => {
                const element = node as HTMLElement; // Cast to HTMLElement if needed
                element.style.backgroundColor = 'white';
                element.style.color = 'gray';
            });
        }
    }

    onSelectMerchant(merchant: any): void {
        merchant.selected = !merchant.selected;

        const nodes = document.querySelectorAll('.marker-icon[data-merchant-id="' + merchant.id.toLowerCase() + '"]');

        if (merchant.selected) {
            this.focusedMerchant = merchant;
            nodes.forEach(node => {
                const element = node as HTMLElement; // Cast to HTMLElement if needed
                element.style.backgroundColor = 'red';
                element.style.color = 'white';
            });
        } else {
            nodes.forEach(node => {
                const element = node as HTMLElement; // Cast to HTMLElement if needed
                element.style.backgroundColor = 'white';
                element.style.color = 'gray';
            });
        }
    }

    private initMap(tiles: any): void {
        // Clear existing markers
        this.markerLayer.clearLayers();

        // Add new markers
        this.merchants.forEach((merchant: any, index) => {
            if (merchant && merchant.latitude && merchant.longtitude) {
                const customDivIcon = L.divIcon({
                    className: 'custom-marker', // CSS class for styling
                    html: '<div class="marker-icon" data-service-id="' + merchant.service_type_id + '" data-merchant-id="' + merchant.id + '">' +
                        '<div class="thumbnail"><img src="' + merchant.service_type_icons + '" alt="icon" width="15px" height="15px"></div>' +
                        '<span>' + merchant.orderNumber + '</span>' +
                        '</div>', // Custom HTML inside the marker
                    iconSize: [44, 40], // Size of the icon
                    iconAnchor: [15, 15] // Anchor point of the icon
                });
                const marker = L.marker([merchant.latitude, merchant.longtitude], {icon: customDivIcon});
                marker.addTo(this.markerLayer); // Add marker to LayerGroup
            }
        });

        // Add LayerGroup to map
        this.markerLayer.addTo(this.map);

        // Add tiles to map
        tiles.addTo(this.map);
    }

    private isSubstringIgnoringAccent(substring: string, mainString: string): boolean {
        const normalize = (str: string) =>
            str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

        const normalizedSubstring = normalize(substring);
        const normalizedMainString = normalize(mainString);
        return normalizedMainString.includes(normalizedSubstring);
    }
}
