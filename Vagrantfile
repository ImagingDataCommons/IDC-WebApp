# -*- mode: ruby -*-
# vi: set ft=ruby :
Vagrant.configure(2) do |config|

  config.vm.provider "virtualbox" do |vb|
     # Display the VirtualBox GUI when booting the machine
     # vb.gui = true

     # Customize the amount of memory on the VM:
     vb.memory = 8192
     vb.cpus = 2

     vb.customize ["modifyvm", :id, "--uart1", "0x3F8", "4"]
     vb.customize ["modifyvm", :id, "--uartmode1", "file", File::NULL]

     vb.customize ["modifyvm", :id, "--nestedpaging", "on"]
     vb.customize ["modifyvm", :id, "--paravirtprovider", "default"]
  end

  config.vm.box = "debian/bookworm64"
  config.vm.box_version = "12.20250126.1"

  # WebApp ports
  config.vm.network "forwarded_port", guest: 8086, host: 8086
  config.vm.network "forwarded_port", guest: 8006, host: 8006
  config.vm.network "forwarded_port", guest: 22, host: 2200, id: "ssh"

  config.vm.synced_folder ".", "/home/vagrant/www"
  config.vm.synced_folder "../", "/home/vagrant/parentDir"
  config.vm.synced_folder "../secure_files", "/home/vagrant/secure_files"

  # Map Common for the WebApp
  config.vm.synced_folder "../IDC-Common", "/home/vagrant/www/IDC-Common"

  # To avoid issues with scripts getting Windows line terminators, always install dos2unix and convert the
  # shell directory before the rest of the provisioning scripts run
  config.vm.provision :shell, inline: "sudo apt-get update", :run => 'always'
  config.vm.provision :shell, inline: "sudo apt-get install dos2unix", :run => 'always'
  config.vm.provision :shell, inline: "dos2unix /home/vagrant/www/shell/*.sh", :run => 'always'
  config.vm.provision :shell, inline: "echo 'source /home/vagrant/www/shell/env.sh' > /etc/profile.d/sa-environment.sh", :run => 'always'
  # This script will kill any further building if settings appear to be wrong
  config.vm.provision "shell", path: 'shell/check-settings.sh', :run => 'always'
  config.vm.provision "shell", path: 'shell/install-deps.sh'
  # TODO: Adjust create and setup to check for database and run if it's not found so they can be set to always
  config.vm.provision "shell", path: 'shell/create-database.sh'
  config.vm.provision "shell", path: 'shell/database-setup.sh'
  config.vm.provision "shell", path: 'shell/vagrant-set-env.sh', :run => 'always'
end