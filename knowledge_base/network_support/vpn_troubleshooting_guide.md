Title: VPN Troubleshooting Guide
Department: Network Support
Document Type: Troubleshooting Guide
Purpose: Help employees resolve issues connecting to the TCS Enterprise VPN for remote access to the corporate network.
Applicable Issues: VPN won't connect, VPN stuck on connecting, can't connect to company VPN, remote access isn't working, VPN keeps disconnecting, VPN connection timeout, VPN authentication failure.

Symptoms:
- VPN client shows "connecting" indefinitely and never completes
- VPN client displays an authentication error despite correct credentials
- VPN connects but disconnects repeatedly after a short time
- Employee cannot reach internal systems (Employee Portal, internal file shares) while working remotely
- VPN client fails to launch or crashes on startup

Troubleshooting / Procedure:
1. Confirm the employee has a working general internet connection outside of the VPN (test by browsing a public website).
2. Verify the employee is using the correct VPN profile for TCS Enterprise and that the client software is up to date.
3. Confirm VPN credentials are correct and the account is not locked (see Account Lockout Troubleshooting if login is failing).
4. Restart the VPN client application fully, or restart the laptop if the client is unresponsive.
5. Attempt to reconnect and note how far the connection progresses before failing (authentication stage vs. tunnel establishment stage).
6. If connection timeouts occur, check whether the employee is on a restricted network (e.g., public Wi-Fi with VPN ports blocked) and suggest an alternate network if possible.
7. Collect VPN client logs (Help > Export Logs in the VPN client) for escalation if the issue is not resolved by the above steps.

Expected Result: VPN connects successfully and the employee can reach internal corporate resources.

Escalation Criteria: Escalate to Network Support with exported VPN logs if the connection consistently fails at the tunnel establishment stage, if authentication fails despite confirmed correct credentials, or if the issue affects multiple employees simultaneously (possible VPN gateway outage).

Important Notes: This document covers VPN client connectivity only. General corporate office Wi-Fi issues are covered in Corporate Wi-Fi Troubleshooting. VPN account lockouts are covered in Account Lockout Troubleshooting.
