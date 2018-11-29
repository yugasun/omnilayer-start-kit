##################################
# Make base image for omnicore
##################################

# init linux system
FROM centos:7

# set workdir
WORKDIR /root

# get omnicore source code
RUN curl -L https://github.com/OmniLayer/omnicore/releases/download/v0.3.1/omnicore-0.3.1-x86_64-linux-gnu.tar.gz | tar xvz && rm -rf omnicore*.tar.gz && mkdir /root/.bitcoin/

# set env path
ENV PATH $PATH:/root/omnicore-0.3.1/bin

# copy bitcoin config file
COPY bitcoin.conf /root/.bitcoin/bitcoin.conf

# copy issue new coin script, you can customize it by yourself
COPY scripts/issue-new-coin.sh /root/

# copy create tx script, you can customize it by yourself
COPY scripts/create-tx.sh /root/

# expose 8080 port
EXPOSE 8080