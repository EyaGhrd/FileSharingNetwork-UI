import {Component, OnDestroy, OnInit} from '@angular/core';
import {HttpClientModule} from '@angular/common/http';
import {EMPTY, Subscription} from "rxjs";
import { CommonModule } from '@angular/common';
import {WebSocketService} from "../socket/web-socket.service";
import {FileTransferService} from "../fileTransfer/file-transfer.service";
import {FileSendService} from "../fileSend/file-send.service";
import {HostService} from "../hostService/host.service";
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [HttpClientModule,CommonModule],
  providers:[HttpClientModule,FileTransferService,WebSocketService,FileSendService,HostService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  private messagesSubscription: Subscription = EMPTY.subscribe();
  private fileSubscription: Subscription = EMPTY.subscribe();
  files: any[] = [];
  selectedFile: any;
  hostID: string='';

  discoveredPeers: PeerMessage[] = [];
  connectedPeers: PeerMessage[] = [];

  constructor(private webSocketService: WebSocketService,
              private fileTransferService : FileTransferService,
              private fileSendService: FileSendService,
              private hostService :HostService) {}

  ngOnInit(): void {
    this.messagesSubscription = this.webSocketService.messages$.subscribe(
      message => {
        if (message.status === 'discovered') {
          this.updateDiscoveredPeers(message);
        } else if (message.status === 'connected') {
          this.updateConnectedPeers(message);
        }
      },
      error => console.error('Error receiving messages:', error)
    );
    this.fileSubscription = this.fileTransferService.getFiles().subscribe(
      files => {
        this.files = files.map(filename => ({ name: filename }));
      },
      error => console.error('Error fetching files:', error)
    );
    this.fileSubscription = this.fileTransferService.getFiles().subscribe(
      files => this.files = files.map(filename => ({ name: filename })),
      error => console.error('Error fetching files:', error)
    );
    this.hostService.getHostID().subscribe({
      next: (data) => this.hostID = data.hostID,
      error: (err) => console.error('Failed to fetch host ID', err)
    });
    console.log('Host:', this.hostID);
  }

  private updateDiscoveredPeers(peer: PeerMessage): void {
    if (!this.discoveredPeers.some(p => p.peerId === peer.peerId)) {
      this.discoveredPeers.push(peer);
    }
  }

  private updateConnectedPeers(peer: PeerMessage): void {
    if (!this.connectedPeers.some(p => p.peerId === peer.peerId)) {
      this.connectedPeers.push(peer);
      this.discoveredPeers = this.discoveredPeers.filter(p => p.peerId !== peer.peerId);
    }
  }

  ngOnDestroy(): void {
    this.messagesSubscription.unsubscribe();
    if (this.fileSubscription) {
      this.fileSubscription.unsubscribe();
    }
  }

  selectFile(file: any): void {
    this.selectedFile = file;
  }

  sendFileName(): void {
    if (this.selectedFile) {
      this.fileSendService.requestFile(this.selectedFile.name).subscribe({
        next: response => {
          console.log('File name sent successfully', response);
          alert('File name sent successfully: ' + this.selectedFile.name);
        },
        error: err => {
          console.error('Error sending file name:', err);
          alert('Error sending file name: ' + err.message);
        }
      });
    } else {
      alert('No file selected');
    }
  }
}

interface PeerMessage {
  status: string;
  peerId: string;
  addresses: string[];
}
